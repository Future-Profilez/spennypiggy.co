<?php

namespace App\Support;

/**
 * The bio page's appearance choices — the server's half of the contract.
 *
 * 🚨 THEMES ARE A CURATED SET, NEVER FREE COLOURS. Every key here names a preset
 * whose text/ground pairs were contrast-checked at design time (asserted by
 * tests/javascript/bioThemes.test.js). A colour picker cannot make that promise
 * — pink-on-pink failing AA is the documented house example — so there is
 * deliberately no hex anywhere in the stored value, only a key.
 *
 * ⚠️ resources/js/constants/bioThemes.js mirrors this list BY HAND (the
 * rewards.js pattern): it holds the actual colour tokens, this class holds what
 * the server will accept. A key added to one and not the other is either a
 * theme nobody can save or a saved value the page cannot draw — change both.
 *
 * ⚠️ An unknown or NULL stored value renders the DEFAULT look on the client, so
 * removing a key here can never blank a page — the safe failure direction.
 */
final class BioAppearance
{
    /** Palette presets. `piglet` is the default (the page's original look). */
    public const THEMES = ['piglet', 'mint', 'butter', 'blush', 'ink'];

    /** How the sellable cards render. `list` is the default product row. */
    public const LAYOUTS = ['list', 'grid'];
}
