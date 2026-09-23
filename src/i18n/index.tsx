'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Language = 'en' | 'es';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // top header & navigation
    editor: 'editor',
    show_editor: 'show editor',
    collapse_editor: 'collapse editor',
    grid: 'grid',
    single: 'single',
    carousel: 'carousel',
    highlight: 'highlight',
    highlight_enable: 'enable paragraph spotlight',
    highlight_disable: 'disable paragraph spotlight',
    theme_light: 'switch to light theme',
    theme_dark: 'switch to dark theme',
    lang_toggle_title: 'cambiar a español rioplatense',

    // export menu
    export: 'export',
    exporting: 'exporting...',
    export_options: 'export options',
    text_overflows: 'text overflows on some pages.',
    export_all_zip: 'export all (zip)',
    export_all_zip_desc: 'download all cards in a zip archive',
    export_all_pages: 'export all pages',
    export_all_pages_desc: 'sequential png/jpeg downloads',
    download_all_images: 'download all images',
    download_as_zip: 'download as zip',
    format: 'format',
    resolution_scale: 'resolution scale',
    presets: 'presets',
    visual_presets: 'visual presets',
    save_current_preset: 'save current layout as preset',
    preset_name_placeholder: 'new preset name...',
    save: 'save',
    cancel: 'cancel',
    manage_presets: 'manage presets',
    shortcuts: 'shortcuts',
    shortcuts_desc: 'keyboard navigation & actions',
    default_badge: 'default',

    // modals
    preset_manager_title: 'preset manager',
    no_presets_saved: 'no custom presets saved yet.',
    apply: 'apply',
    rename: 'rename',
    duplicate: 'duplicate',
    delete: 'delete',
    shortcuts_title: 'keyboard shortcuts',
    close_esc: 'close (esc)',
    previous_page: 'previous page',
    next_page: 'next page',
    toggle_editor: 'toggle editor panel',
    cycle_view_modes: 'cycle view modes (grid / single / carousel)',
    toggle_spotlight: 'toggle paragraph spotlight',
    auto_fit_canvas: 'auto-fit text to fill canvas',
    export_cards: 'export cards',
    fullscreen_mode: 'fullscreen mode',
    exit_fullscreen: 'exit fullscreen / close modal',
    export_all_shortcut: 'export all',
    undo_shortcut: 'undo',
    redo_shortcut: 'redo',
    toggle_lock_shortcut: 'toggle layout lock',
    fullscreen_preview_shortcut: 'fullscreen preview',

    // editor panel
    markdown_text: 'markdown text',
    words: 'words',
    chars: 'chars',
    pages_count: 'pages',
    paste_sample: 'paste sample text',
    clear: 'clear',
    editor_placeholder: 'write or paste your long-form text here...',
    manual_breaks: 'manual breaks',
    insert_break_cursor: 'insert break at cursor',
    drop_file: 'drop text (.txt) or markdown (.md) here',

    // docked toolbar
    page_singular: 'page',
    pages_plural: 'pages',
    pages_tooltip: 'number of pages and distribution',
    number_of_pages: 'number of pages',
    custom_count: 'custom count:',
    distribution_mode: 'distribution mode',
    balanced: 'balanced',
    balanced_desc: 'distribute paragraphs evenly across all pages',
    paragraph: 'paragraph',
    paragraph_desc: 'fill each page naturally before moving to the next',
    manual: 'manual',
    manual_desc: 'custom page breaks using --- in editor',
    typography: 'typography',
    font: 'font',
    font_tooltip: 'choose typography font',
    search_fonts: 'search fonts...',
    upload_font: 'upload font',
    remove_fav: 'remove from favorites',
    add_fav: 'add to favorites',
    size: 'size',
    size_tooltip: 'adjust font size, weight and line height',
    font_size_spacing: 'font size & spacing',
    auto_fit_font_size: 'auto-fit font size',
    scale_text_to_fill: 'scale text to fill pages',
    auto_fit: 'auto-fit',
    auto_fit_is_active: 'auto-fit is active (click to use manual size)',
    enable_auto_fit: 'enable auto-fit to fill pages',
    auto_balance: 'auto-balance',
    auto_balance_on: 'auto-balance is on (compact 48px, trim all, whole paragraphs) — click to disable',
    auto_balance_desc: 'auto-balance: 1-click snap to optimal density, compact margins, and 100% vertical fill',
    font_size: 'font size',
    font_weight: 'font weight',
    regular_400_only: 'regular 400 only',
    line_height: 'line height',
    letter_spacing: 'letter spacing',
    weight: 'weight',
    align_left: 'left align',
    align_center: 'center align',
    align_right: 'right align',
    align_justify: 'justify',
    top: 'top',
    center: 'center',
    justify: 'justify',
    align_top_tip: 'top align text on canvas',
    align_center_tip: 'center text vertically',
    align_justify_tip: 'justify text across canvas height',
    canvas_format: 'canvas format',
    canvas_format_tooltip: 'change canvas aspect ratio & dimensions',
    card_height_mode: 'card height mode',
    trim_all: 'trim all',
    trim_all_desc: 'auto-fit every card height to content (100% util, no empty space)',
    trim_last: 'trim last',
    trim_last_desc: 'cards 1-(n-1) stay uniform 4:5 for carousels; only last card trims',
    fixed: 'fixed',
    fixed_desc: 'strict fixed canvas dimensions for all cards',
    custom_dimensions: 'custom dimensions',
    margins_spacing: 'margins & spacing',
    margins_tooltip: 'change margins & paragraph spacing',
    margins: 'margins',
    compact: 'compact',
    generous: 'generous',
    paragraph_spacing: 'paragraph spacing',
    colors: 'colors',
    colors_tooltip: 'change canvas background and text colors',
    colors_appearance: 'colors & appearance',
    curated_palettes: 'curated palettes',
    custom_colors: 'custom colors',
    background: 'background',
    background_desc: 'card canvas fill',
    text_color: 'text color',
    text_desc: 'typography & headings',
    transparent_bg: 'transparent background',
    export_alpha: 'export with alpha channel',
    more: 'more',
    more_tooltip: 'more options (presets, shortcuts, lock layout, reset)',
    system_presets: 'system & presets',
    layout_locked: 'layout locked',
    lock_layout: 'lock layout',
    reset_all_defaults: 'reset all to defaults',
    reset_confirm: 'reset all settings to defaults?',
    fill_canvas: 'fill canvas',
    fill_canvas_desc: 'optimize font size & spacing to fill canvas',
    author_preferred: 'author preferred',
    author_preferred_desc: 'restore curated typography settings',
    reset_all: 'reset all',
    reset_all_desc: 'reset all settings to factory default',

    // preview & cards
    page_counter: 'page {current} of {total}',
    copy_text: 'copy text',
    copy_page_text: 'copy text for this page',
    copied: 'copied',
    download: 'download',
    download_page_image: 'download this page image',
    downloading: 'downloading...',
    fullscreen: 'fullscreen',
    enlarge_preview: 'enlarge preview',
    fit: 'fit',
    fit_desc: 'fit to window',
    zoom_100: '100%',
    zoom_100_desc: 'zoom to 100%',
    prev_page_arrow: 'previous page (left arrow)',
    next_page_arrow: 'next page (right arrow)',
    untitled: 'untitled',
    overflow_badge: 'overflow ~{px}px',
    page_overflows_by: 'page {page} overflows by ~{px}px.',
    pages_overflow_bounds: '{count} pages overflow canvas bounds.',
    auto_fit_text: 'auto-fit text',
    prev: 'prev',
    next: 'next',
    jump_to_page: 'jump to page {page}',
    export_blocked_clipped: 'export blocked: page {page} contains clipped text.',
  },
  es: {
    // top header & navigation
    editor: 'editor',
    show_editor: 'mostrar editor',
    collapse_editor: 'ocultar editor',
    grid: 'cuadrícula',
    single: 'individual',
    carousel: 'carrusel',
    highlight: 'destacar',
    highlight_enable: 'activar foco de párrafo',
    highlight_disable: 'desactivar foco de párrafo',
    theme_light: 'cambiar a modo claro',
    theme_dark: 'cambiar a modo oscuro',
    lang_toggle_title: 'switch to english',

    // export menu
    export: 'exportar',
    exporting: 'exportando...',
    export_options: 'opciones de exportación',
    text_overflows: 'el texto desborda en algunas páginas.',
    export_all_zip: 'exportar todo (zip)',
    export_all_zip_desc: 'descargá todas las tarjetas en un archivo zip',
    export_all_pages: 'exportar todas las páginas',
    export_all_pages_desc: 'descargas secuenciales en png/jpeg',
    download_all_images: 'descargar todas las imágenes',
    download_as_zip: 'descargar en archivo zip',
    format: 'formato',
    resolution_scale: 'escala de resolución',
    presets: 'ajustes',
    visual_presets: 'ajustes visuales',
    save_current_preset: 'guardar diseño actual como ajuste',
    preset_name_placeholder: 'nombre del ajuste...',
    save: 'guardar',
    cancel: 'cancelar',
    manage_presets: 'administrar ajustes',
    shortcuts: 'atajos',
    shortcuts_desc: 'navegación y atajos de teclado',
    default_badge: 'predeterminado',

    // modals
    preset_manager_title: 'administrador de ajustes',
    no_presets_saved: 'todavía no guardaste ningún ajuste personalizado.',
    apply: 'aplicar',
    rename: 'renombrar',
    duplicate: 'duplicar',
    delete: 'eliminar',
    shortcuts_title: 'atajos de teclado',
    close_esc: 'cerrar (esc)',
    previous_page: 'página anterior',
    next_page: 'página siguiente',
    toggle_editor: 'mostrar u ocultar editor',
    cycle_view_modes: 'rotar vistas (cuadrícula / individual / carrusel)',
    toggle_spotlight: 'activar o desactivar foco de párrafo',
    auto_fit_canvas: 'autoajustar texto para llenar el lienzo',
    export_cards: 'exportar tarjetas',
    fullscreen_mode: 'pantalla completa',
    exit_fullscreen: 'salir de pantalla completa / cerrar modal',
    export_all_shortcut: 'exportar todo',
    undo_shortcut: 'deshacer',
    redo_shortcut: 'rehacer',
    toggle_lock_shortcut: 'bloquear o desbloquear diseño',
    fullscreen_preview_shortcut: 'vista en pantalla completa',

    // editor panel
    markdown_text: 'texto en markdown',
    words: 'palabras',
    chars: 'caracteres',
    pages_count: 'páginas',
    paste_sample: 'pegar texto de ejemplo',
    clear: 'limpiar',
    editor_placeholder: 'escribí o pegá tu texto largo acá...',
    manual_breaks: 'cortes manuales',
    insert_break_cursor: 'insertar corte en el cursor',
    drop_file: 'soltá un archivo de texto (.txt) o markdown (.md) acá',

    // docked toolbar
    page_singular: 'página',
    pages_plural: 'páginas',
    pages_tooltip: 'cantidad de páginas y distribución',
    number_of_pages: 'cantidad de páginas',
    custom_count: 'cantidad personalizada:',
    distribution_mode: 'modo de distribución',
    balanced: 'balanceado',
    balanced_desc: 'distribuí los párrafos de forma pareja entre todas las páginas',
    paragraph: 'párrafo',
    paragraph_desc: 'llená cada página de forma natural antes de pasar a la siguiente',
    manual: 'manual',
    manual_desc: 'saltos de página manuales usando --- en el editor',
    typography: 'tipografía',
    font: 'fuente',
    font_tooltip: 'elegir fuente tipográfica',
    search_fonts: 'buscar fuentes...',
    upload_font: 'subir fuente',
    remove_fav: 'quitar de favoritos',
    add_fav: 'agregar a favoritos',
    size: 'tamaño',
    size_tooltip: 'ajustar tamaño, peso e interlineado',
    font_size_spacing: 'tamaño de fuente y espaciado',
    auto_fit_font_size: 'autoajustar tamaño de fuente',
    scale_text_to_fill: 'escalar texto para llenar páginas',
    auto_fit: 'autoajuste',
    auto_fit_is_active: 'autoajuste activo (hacé clic para tamaño manual)',
    enable_auto_fit: 'activar autoajuste para llenar páginas',
    auto_balance: 'balance automático',
    auto_balance_on: 'balance automático activo (compacto 48px, recortar todo, párrafos enteros) — hacé clic para desactivar',
    auto_balance_desc: 'balance automático: 1 clic para densidad óptima, márgenes compactos y 100% llenado vertical',
    font_size: 'tamaño de fuente',
    font_weight: 'peso de fuente',
    regular_400_only: 'solo regular 400',
    line_height: 'interlineado',
    letter_spacing: 'interletreado',
    weight: 'peso',
    align_left: 'alinear a la izquierda',
    align_center: 'centrar texto',
    align_right: 'alinear a la derecha',
    align_justify: 'justificar',
    top: 'arriba',
    center: 'centro',
    justify: 'justificar',
    align_top_tip: 'alinear texto arriba en el lienzo',
    align_center_tip: 'centrar texto verticalmente',
    align_justify_tip: 'justificar texto en la altura del lienzo',
    canvas_format: 'formato de lienzo',
    canvas_format_tooltip: 'cambiar dimensiones y proporción del lienzo',
    card_height_mode: 'altura de tarjeta',
    trim_all: 'recortar todo',
    trim_all_desc: 'ajustá la altura de cada tarjeta al contenido (100% uso, sin espacio vacío)',
    trim_last: 'recortar última',
    trim_last_desc: 'las tarjetas 1 a n-1 quedan en 4:5 para carruseles; solo se recorta la última',
    fixed: 'fijo',
    fixed_desc: 'dimensiones fijas y estrictas para todas las tarjetas',
    custom_dimensions: 'dimensiones personalizadas',
    margins_spacing: 'márgenes y espaciado',
    margins_tooltip: 'cambiar márgenes y espaciado de párrafos',
    margins: 'márgenes',
    compact: 'compacto',
    generous: 'generoso',
    paragraph_spacing: 'espaciado entre párrafos',
    colors: 'colores',
    colors_tooltip: 'cambiar color de fondo y color de texto',
    colors_appearance: 'colores y apariencia',
    curated_palettes: 'paletas curadas',
    custom_colors: 'colores personalizados',
    background: 'fondo',
    background_desc: 'relleno del lienzo',
    text_color: 'color de texto',
    text_desc: 'tipografía y encabezados',
    transparent_bg: 'fondo transparente',
    export_alpha: 'exportar con canal alfa',
    more: 'más',
    more_tooltip: 'más opciones (ajustes, atajos, bloquear diseño, restablecer)',
    system_presets: 'sistema y ajustes',
    layout_locked: 'diseño bloqueado',
    lock_layout: 'bloquear diseño',
    reset_all_defaults: 'restablecer todo a valores iniciales',
    reset_confirm: '¿restablecer todos los ajustes a los valores iniciales?',
    fill_canvas: 'llenar lienzo',
    fill_canvas_desc: 'optimizá tamaño de fuente y espaciado para llenar el lienzo',
    author_preferred: 'preferido del autor',
    author_preferred_desc: 'restaurá la configuración tipográfica curada',
    reset_all: 'restablecer todo',
    reset_all_desc: 'restablecé todos los ajustes a los valores iniciales',

    // preview & cards
    page_counter: 'página {current} de {total}',
    copy_text: 'copiar texto',
    copy_page_text: 'copiar texto de esta página',
    copied: 'copiado',
    download: 'descargar',
    download_page_image: 'descargar imagen de esta página',
    downloading: 'descargando...',
    fullscreen: 'pantalla completa',
    enlarge_preview: 'agrandar vista previa',
    fit: 'ajustar',
    fit_desc: 'ajustar a la ventana',
    zoom_100: '100%',
    zoom_100_desc: 'ver al 100%',
    prev_page_arrow: 'página anterior (flecha izquierda)',
    next_page_arrow: 'página siguiente (flecha derecha)',
    untitled: 'sin título',
    overflow_badge: 'desborde ~{px}px',
    page_overflows_by: 'la página {page} desborda por ~{px}px.',
    pages_overflow_bounds: '{count} páginas desbordan los límites del lienzo.',
    auto_fit_text: 'autoajustar texto',
    prev: 'ant',
    next: 'sig',
    jump_to_page: 'ir a la página {page}',
    export_blocked_clipped: 'exportación bloqueada: la página {page} contiene texto recortado.',
  },
};

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
  t: (key: string) => key.toLowerCase(),
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('longform-rasterizer-lang') as Language;
      if (saved === 'en' || saved === 'es') {
        setLangState(saved);
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('longform-rasterizer-lang', newLang);
    } catch {
      // Ignore
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next: Language = prev === 'en' ? 'es' : 'en';
      try {
        localStorage.setItem('longform-rasterizer-lang', next);
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = translations[lang] || translations.en;
      let text = dict[key] || translations.en[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return text.toLowerCase();
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
