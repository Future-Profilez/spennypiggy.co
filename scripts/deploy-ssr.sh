#!/usr/bin/env bash
#
# Ship the Inertia SSR bundle to the EC2 render host.
#
# 🚨 THIS IS NOT PART OF `vapor deploy` AND NEVER RUNS ON ITS OWN.
#
# A Vapor deploy ships the Lambda: PHP, routes, props, and the built CLIENT
# assets. It does NOT ship the SSR bundle — `vapor.yml` lists `bootstrap/ssr` in
# its `ignore` key (the bundle is ~55MB and the artefact already sits close to
# Lambda's hard 262MB ceiling), and the build step writes only a marker file so
# `Inertia\Ssr\BundleDetector`'s file_exists() passes.
#
# So after any change under `resources/js`, the Lambda serves new props to an
# OLD server-rendered page until this script runs. Nothing errors. The page looks
# right to a signed-in human — client-side React hydrates over it — and wrong to
# exactly the audience SSR was added for: Google, and link previews. Measured
# 31 Aug 2026: host bundle 28 Aug, S3 bundle 29 Aug, source 30 Aug. Two hops,
# both manual, both behind.
#
# 🚨 THERE IS ONE SSR HOST AND BOTH ENVIRONMENTS RENDER FROM IT.
#
# There is no "push the bundle to dev". Measured 31 Aug 2026: one instance
# (i-0db5c85393b62393f), one bucket, one /opt/ssr, one systemd unit — and the
# host's security group admits port 13714 from the SG that carries BOTH
# `vapor-SpennyPiggy-development` and `vapor-SpennyPiggy-production`. So running
# this script is a PRODUCTION CHANGE even when you only meant to refresh dev, and
# the usual "ship to dev, look at it, then ship live" sequence does not hold for
# the bundle: the moment it lands, production's server-rendered HTML changes too.
#
# ⚠️ THE DANGEROUS CASE IS A NEW PROP. Dev and production run different PHP while
# sharing one bundle, so a component that reads a prop only the newer PHP sends
# renders correctly on the environment you deployed and wrong on the other. Until
# there is a second host (or a second service on a second port), the only safe
# order is: deploy BOTH environments, then push the bundle once.
#
# 🚨 RUN IT AFTER THE VAPOR DEPLOY, NOT BEFORE. The bundle renders whatever props
# the Lambda sends it; pushing a bundle that expects props the deployed PHP does
# not send yet is the one ordering that can render a broken page.
#
# Usage:  ./scripts/deploy-ssr.sh [--skip-build] [--yes]
#
set -euo pipefail

REGION="eu-west-2"
INSTANCE="i-0db5c85393b62393f"          # spennypiggy-ssr, private subnet
BUCKET="spennypiggy-ssr-bundle-126109305644"
SERVICE="inertia-ssr"
PORT="13714"

say() { printf '\n\033[1m▸ %s\033[0m\n' "$1"; }

# ⚠️ A confirmation, because the blast radius is not what the command reads like.
# `--yes` is for CI; a person gets asked, once, naming what it touches.
if [[ " $* " != *" --yes "* ]]; then
  printf '\033[1mThis pushes ONE bundle that BOTH dev and production render from.\033[0m\n'
  printf 'Production server-rendered HTML changes as soon as it lands.\n'
  read -r -p 'Both environments already deployed with the matching PHP? [y/N] ' reply
  [[ "$reply" == "y" || "$reply" == "Y" ]] || { echo "Stopped."; exit 1; }
fi

if [[ " $* " != *" --skip-build "* ]]; then
  say "Building the SSR bundle"
  npm run ssr:build
fi

[[ -f bootstrap/ssr/ssr.js ]] || { echo "bootstrap/ssr/ssr.js missing — build failed"; exit 1; }

say "Uploading to s3://$BUCKET/ssr/"
# ⚠️ The source map is EXCLUDED — 47MB that the host never reads. `--delete`
# removes chunks a rebuild no longer produces; without it the host accumulates
# orphaned assets from every previous build and the directory only ever grows.
aws s3 sync bootstrap/ssr/ "s3://$BUCKET/ssr/" \
  --region "$REGION" --delete --exclude "*.map" --only-show-errors

say "Pulling it onto the host and restarting $SERVICE"
CMD=$(aws ssm send-command \
  --region "$REGION" --instance-ids "$INSTANCE" \
  --document-name "AWS-RunShellScript" \
  --parameters "commands=[
    \"set -e\",
    \"aws s3 sync s3://$BUCKET/ssr/ /opt/ssr/ --delete --only-show-errors\",
    \"chown -R ssr:ssr /opt/ssr\",
    \"systemctl restart $SERVICE\",
    \"sleep 3\",
    \"systemctl is-active $SERVICE\",
    \"curl -s -o /dev/null -w 'health:%{http_code}' http://127.0.0.1:$PORT/health\"
  ]" \
  --query "Command.CommandId" --output text)

# ⚠️ Poll rather than sleep a fixed amount: the sync is the slow part and it
# grows with the bundle, so a fixed wait either lies or wastes time.
for _ in $(seq 1 30); do
  sleep 2
  STATUS=$(aws ssm get-command-invocation --region "$REGION" \
    --command-id "$CMD" --instance-id "$INSTANCE" \
    --query "Status" --output text 2>/dev/null || echo Pending)
  [[ "$STATUS" == "InProgress" || "$STATUS" == "Pending" ]] || break
done

OUT=$(aws ssm get-command-invocation --region "$REGION" \
  --command-id "$CMD" --instance-id "$INSTANCE" \
  --query "StandardOutputContent" --output text)
ERR=$(aws ssm get-command-invocation --region "$REGION" \
  --command-id "$CMD" --instance-id "$INSTANCE" \
  --query "StandardErrorContent" --output text)

echo "$OUT"
[[ -n "${ERR// }" && "$ERR" != "None" ]] && echo "stderr: $ERR"

if [[ "$STATUS" != "Success" ]]; then
  echo "✗ SSR deploy finished as $STATUS — the host is still serving the OLD bundle."
  exit 1
fi

say "Done — $STATUS"
echo "⚠️  Verify a real page renders the change in VIEW-SOURCE, not just in the browser:"
echo "    curl -s https://spennypiggy.co/creators/vs/throne | grep -c 'See the full table'"
