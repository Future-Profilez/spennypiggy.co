import Critters from 'critters';
import fs from 'fs';
import path from 'path';

export function criticalCss(options = {}) {
  const {
    patterns = ['**/*.blade.php'],
    inlineThreshold = 0, // Inline all critical CSS
    minimumExternalSize = 0,
    pruneSource = false, // Keep original stylesheets for non-critical styles
    preload = 'media',
    noscriptFallback = true,
    inlineFonts = false,
    preloadFonts = true,
    compress = true,
    logLevel = 'info'
  } = options;

  let critters;

  return {
    name: 'vite-critical-css',
    apply: 'build',
    
    configResolved(config) {
      // Initialize Critters with configuration
      critters = new Critters({
        path: config.build.outDir,
        publicPath: config.base || '/',
        inlineThreshold,
        minimumExternalSize,
        pruneSource,
        preload,
        noscriptFallback,
        inlineFonts,
        preloadFonts,
        compress,
        logLevel
      });
    },

    async generateBundle(options, bundle) {
      // Process HTML files in the bundle
      const htmlFiles = Object.keys(bundle).filter(fileName => fileName.endsWith('.html'));
      
      for (const fileName of htmlFiles) {
        const htmlAsset = bundle[fileName];
        if (htmlAsset.type === 'asset' && typeof htmlAsset.source === 'string') {
          try {
            console.log(`Processing critical CSS for: ${fileName}`);
            const criticalHtml = await critters.process(htmlAsset.source);
            htmlAsset.source = criticalHtml;
          } catch (error) {
            console.error(`Error processing critical CSS for ${fileName}:`, error);
          }
        }
      }
    }
  };
}

// Alternative implementation using Penthouse for more control
export function penthouseCriticalCss(options = {}) {
  return {
    name: 'vite-penthouse-critical',
    apply: 'build',
    
    async generateBundle(options, bundle) {
      const { default: penthouse } = await import('penthouse');
      
      // Find CSS and HTML files
      const cssFiles = Object.keys(bundle).filter(f => f.endsWith('.css'));
      const htmlFiles = Object.keys(bundle).filter(f => f.endsWith('.html'));
      
      for (const htmlFile of htmlFiles) {
        const htmlAsset = bundle[htmlFile];
        if (htmlAsset.type === 'asset' && typeof htmlAsset.source === 'string') {
          for (const cssFile of cssFiles) {
            try {
              console.log(`Extracting critical CSS from ${cssFile} for ${htmlFile}`);
              
              const criticalCss = await penthouse({
                url: `data:text/html;base64,${Buffer.from(htmlAsset.source).toString('base64')}`,
                cssString: bundle[cssFile].source || '',
                width: 1300,
                height: 900,
                forceInclude: [
                  '.btn-*',
                  '.heading*',
                  '.font-*',
                  '.text-*',
                  '.bg-*',
                  '[data-aos]'
                ],
                timeout: 30000,
                maxEmbeddedBase64Length: 1000
              });

              if (criticalCss) {
                // Inline critical CSS and defer the rest
                let modifiedHtml = htmlAsset.source;
                
                // Add critical CSS inline
                const criticalStyleTag = `<style data-critical="true">${criticalCss}</style>`;
                modifiedHtml = modifiedHtml.replace('</head>', `${criticalStyleTag}</head>`);
                
                // Defer non-critical CSS
                modifiedHtml = modifiedHtml.replace(
                  new RegExp(`<link[^>]*href=[^>]*${cssFile}[^>]*>`, 'g'),
                  `<link rel="preload" href="/${cssFile}" as="style" onload="this.onload=null;this.rel='stylesheet'">
                   <noscript><link rel="stylesheet" href="/${cssFile}"></noscript>`
                );
                
                htmlAsset.source = modifiedHtml;
              }
            } catch (error) {
              console.error(`Error processing critical CSS for ${htmlFile}:`, error);
            }
          }
        }
      }
    }
  };
}
