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
    // Top header & navigation
    editor: 'Editor',
    show_editor: 'Show Editor',
    collapse_editor: 'Collapse Editor',
    grid: 'Grid',
    single: 'Single',
    carousel: 'Carousel',
    highlight: 'Highlight',
    highlight_enable: 'Enable paragraph spotlight',
    highlight_disable: 'Disable paragraph spotlight',
    theme_light: 'Switch to light theme',
    theme_dark: 'Switch to dark theme',
    lang_toggle_title: 'Cambiar a español rioplatense',

    // Export menu
    export: 'Export',
    exporting: 'Exporting...',
    export_options: 'Export Options',
    text_overflows: 'Text overflows on some pages.',
    export_all_zip: 'Export All (ZIP)',
    export_all_zip_desc: 'Download all cards in a ZIP archive',
    export_all_pages: 'Export All Pages',
    export_all_pages_desc: 'Sequential PNG/JPEG downloads',
    download_all_images: 'Download all images',
    download_as_zip: 'Download as ZIP',
    format: 'Format',
    resolution_scale: 'Resolution Scale',
    presets: 'Presets',
    visual_presets: 'Visual Presets',
    save_current_preset: 'Save current layout as preset',
    preset_name_placeholder: 'New preset name...',
    save: 'Save',
    cancel: 'Cancel',
    manage_presets: 'Manage Presets',
    shortcuts: 'Shortcuts',
    shortcuts_desc: 'Keyboard navigation & actions',
    default_badge: 'Default',

    // Modals
    preset_manager_title: 'Preset Manager',
    no_presets_saved: 'No custom presets saved yet.',
    apply: 'Apply',
    rename: 'Rename',
    duplicate: 'Duplicate',
    delete: 'Delete',
    shortcuts_title: 'Keyboard Shortcuts',
    close_esc: 'Close (Esc)',
    previous_page: 'Previous page',
    next_page: 'Next page',
    toggle_editor: 'Toggle editor panel',
    cycle_view_modes: 'Cycle view modes (Grid / Single / Carousel)',
    toggle_spotlight: 'Toggle paragraph spotlight',
    auto_fit_canvas: 'Auto-fit text to fill canvas',
    export_cards: 'Export cards',
    fullscreen_mode: 'Fullscreen mode',
    exit_fullscreen: 'Exit fullscreen / close modal',
    export_all_shortcut: 'Export all',
    undo_shortcut: 'Undo',
    redo_shortcut: 'Redo',
    toggle_lock_shortcut: 'Toggle layout lock',
    fullscreen_preview_shortcut: 'Fullscreen preview',

    // Editor panel
    markdown_text: 'Markdown Text',
    words: 'words',
    chars: 'chars',
    pages_count: 'pages',
    paste_sample: 'Paste Sample Text',
    clear: 'Clear',
    editor_placeholder: 'Write or paste your long-form text here...',
    manual_breaks: 'Manual Breaks',
    insert_break_cursor: 'Insert break at cursor',
    drop_file: 'Drop text (.txt) or markdown (.md) here',

    // Docked toolbar
    page_singular: 'Page',
    pages_plural: 'pages',
    pages_tooltip: 'Number of pages and distribution',
    number_of_pages: 'Number of pages',
    custom_count: 'Custom count:',
    distribution_mode: 'Distribution mode',
    balanced: 'Balanced',
    balanced_desc: 'Distribute paragraphs evenly across all pages',
    paragraph: 'Paragraph',
    paragraph_desc: 'Fill each page naturally before moving to the next',
    manual: 'Manual',
    manual_desc: 'Custom page breaks using --- in editor',
    typography: 'Typography',
    font: 'Font',
    font_tooltip: 'Choose typography font',
    search_fonts: 'Search fonts...',
    upload_font: 'Upload Font',
    remove_fav: 'Remove from favorites',
    add_fav: 'Add to favorites',
    size: 'Size',
    size_tooltip: 'Adjust font size, weight and line height',
    font_size_spacing: 'Font Size & Spacing',
    auto_fit_font_size: 'Auto-fit font size',
    scale_text_to_fill: 'Scale text to fill pages',
    auto_fit: 'Auto-fit',
    auto_fit_is_active: 'Auto-fit is active (click to use manual size)',
    enable_auto_fit: 'Enable auto-fit to fill pages',
    auto_balance: 'Auto-balance',
    auto_balance_on: 'Auto-balance is on (compact 48px, trim all, whole paragraphs) — click to disable',
    auto_balance_desc: 'Auto-balance: 1-click snap to optimal density, compact margins, and 100% vertical fill',
    font_size: 'Font size',
    font_weight: 'Font weight',
    regular_400_only: 'Regular 400 only',
    line_height: 'Line height',
    letter_spacing: 'Letter spacing',
    weight: 'Weight',
    align_left: 'Left align',
    align_center: 'Center align',
    align_right: 'Right align',
    align_justify: 'Justify',
    top: 'Top',
    center: 'Center',
    justify: 'Justify',
    align_top_tip: 'Top align text on canvas',
    align_center_tip: 'Center text vertically',
    align_justify_tip: 'Justify text across canvas height',
    canvas_format: 'Canvas Format',
    canvas_format_tooltip: 'Change canvas aspect ratio & dimensions',
    card_height_mode: 'Card height mode',
    trim_all: 'Trim All',
    trim_all_desc: 'Auto-fit every card height to content (100% util, no empty space)',
    trim_last: 'Trim Last',
    trim_last_desc: 'Cards 1-(n-1) stay uniform 4:5 for carousels; only last card trims',
    fixed: 'Fixed',
    fixed_desc: 'Strict fixed canvas dimensions for all cards',
    custom_dimensions: 'Custom dimensions',
    margins_spacing: 'Margins & Spacing',
    margins_tooltip: 'Change margins & paragraph spacing',
    margins: 'Margins',
    compact: 'Compact',
    generous: 'Generous',
    paragraph_spacing: 'Paragraph spacing',
    colors: 'Colors',
    colors_tooltip: 'Change canvas background and text colors',
    colors_appearance: 'Colors & Appearance',
    curated_palettes: 'Curated palettes',
    custom_colors: 'Custom colors',
    background: 'Background',
    background_desc: 'Card canvas fill',
    text_color: 'Text Color',
    text_desc: 'Typography & headings',
    transparent_bg: 'Transparent background',
    export_alpha: 'Export with alpha channel',
    more: 'More',
    more_tooltip: 'More options (presets, shortcuts, lock layout, reset)',
    system_presets: 'System & Presets',
    layout_locked: 'Layout locked',
    lock_layout: 'Lock layout',
    reset_all_defaults: 'Reset all to defaults',
    reset_confirm: 'Reset all settings to defaults?',
    fill_canvas: 'Fill canvas',
    fill_canvas_desc: 'Optimize font size & spacing to fill canvas',
    author_preferred: 'Author preferred',
    author_preferred_desc: 'Restore curated typography settings',
    reset_all: 'Reset all',
    reset_all_desc: 'Reset all settings to factory default',

    // Preview & cards
    page_counter: 'Page {current} of {total}',
    copy_text: 'Copy text',
    copy_page_text: 'Copy text for this page',
    copied: 'Copied',
    download: 'Download',
    download_page_image: 'Download this page image',
    downloading: 'Downloading...',
    fullscreen: 'Fullscreen',
    enlarge_preview: 'Enlarge preview',
    fit: 'Fit',
    fit_desc: 'Fit to window',
    zoom_100: '100%',
    zoom_100_desc: 'Zoom to 100%',
    prev_page_arrow: 'Previous page (Left arrow)',
    next_page_arrow: 'Next page (Right arrow)',
    untitled: 'Untitled',
    overflow_badge: 'Overflow ~{px}px',
    page_overflows_by: 'Page {page} overflows by ~{px}px.',
    pages_overflow_bounds: '{count} pages overflow canvas bounds.',
    auto_fit_text: 'Auto-fit Text',
    prev: 'Prev',
    next: 'Next',
    jump_to_page: 'Jump to Page {page}',
    export_blocked_clipped: 'Export blocked: Page {page} contains clipped text.',
  },
  es: {
    // Top header & navigation
    editor: 'Editor',
    show_editor: 'Mostrar Editor',
    collapse_editor: 'Ocultar Editor',
    grid: 'Cuadrícula',
    single: 'Individual',
    carousel: 'Carrusel',
    highlight: 'Destacar',
    highlight_enable: 'Activar foco de párrafo',
    highlight_disable: 'Desactivar foco de párrafo',
    theme_light: 'Cambiar a modo claro',
    theme_dark: 'Cambiar a modo oscuro',
    lang_toggle_title: 'Switch to English',

    // Export menu
    export: 'Exportar',
    exporting: 'Exportando...',
    export_options: 'Opciones de Exportación',
    text_overflows: 'El texto desborda en algunas páginas.',
    export_all_zip: 'Exportar todo (ZIP)',
    export_all_zip_desc: 'Descargá todas las tarjetas en un archivo ZIP',
    export_all_pages: 'Exportar todas las páginas',
    export_all_pages_desc: 'Descargas secuenciales en PNG/JPEG',
    download_all_images: 'Descargar todas las imágenes',
    download_as_zip: 'Descargar en archivo ZIP',
    format: 'Formato',
    resolution_scale: 'Escala de Resolución',
    presets: 'Ajustes',
    visual_presets: 'Ajustes Visuales',
    save_current_preset: 'Guardar diseño actual como ajuste',
    preset_name_placeholder: 'Nombre del ajuste...',
    save: 'Guardar',
    cancel: 'Cancelar',
    manage_presets: 'Administrar Ajustes',
    shortcuts: 'Atajos',
    shortcuts_desc: 'Navegación y atajos de teclado',
    default_badge: 'Predeterminado',

    // Modals
    preset_manager_title: 'Administrador de Ajustes',
    no_presets_saved: 'Todavía no guardaste ningún ajuste personalizado.',
    apply: 'Aplicar',
    rename: 'Renombrar',
    duplicate: 'Duplicar',
    delete: 'Eliminar',
    shortcuts_title: 'Atajos de Teclado',
    close_esc: 'Cerrar (Esc)',
    previous_page: 'Página anterior',
    next_page: 'Página siguiente',
    toggle_editor: 'Mostrar u ocultar editor',
    cycle_view_modes: 'Rotar vistas (Cuadrícula / Individual / Carrusel)',
    toggle_spotlight: 'Activar o desactivar foco de párrafo',
    auto_fit_canvas: 'Autoajustar texto para llenar el lienzo',
    export_cards: 'Exportar tarjetas',
    fullscreen_mode: 'Pantalla completa',
    exit_fullscreen: 'Salir de pantalla completa / cerrar modal',
    export_all_shortcut: 'Exportar todo',
    undo_shortcut: 'Deshacer',
    redo_shortcut: 'Rehacer',
    toggle_lock_shortcut: 'Bloquear o desbloquear diseño',
    fullscreen_preview_shortcut: 'Vista en pantalla completa',

    // Editor panel
    markdown_text: 'Texto en Markdown',
    words: 'palabras',
    chars: 'caracteres',
    pages_count: 'páginas',
    paste_sample: 'Pegar Texto de Ejemplo',
    clear: 'Limpiar',
    editor_placeholder: 'Escribí o pegá tu texto largo acá...',
    manual_breaks: 'Cortes Manuales',
    insert_break_cursor: 'Insertar corte en el cursor',
    drop_file: 'Soltá un archivo de texto (.txt) o markdown (.md) acá',

    // Docked toolbar
    page_singular: 'Página',
    pages_plural: 'páginas',
    pages_tooltip: 'Cantidad de páginas y distribución',
    number_of_pages: 'Cantidad de páginas',
    custom_count: 'Cantidad personalizada:',
    distribution_mode: 'Modo de distribución',
    balanced: 'Balanceado',
    balanced_desc: 'Distribuí los párrafos de forma pareja entre todas las páginas',
    paragraph: 'Párrafo',
    paragraph_desc: 'Llená cada página de forma natural antes de pasar a la siguiente',
    manual: 'Manual',
    manual_desc: 'Saltos de página manuales usando --- en el editor',
    typography: 'Tipografía',
    font: 'Fuente',
    font_tooltip: 'Elegir fuente tipográfica',
    search_fonts: 'Buscar fuentes...',
    upload_font: 'Subir Fuente',
    remove_fav: 'Quitar de favoritos',
    add_fav: 'Agregar a favoritos',
    size: 'Tamaño',
    size_tooltip: 'Ajustar tamaño, peso e interlineado',
    font_size_spacing: 'Tamaño de Fuente y Espaciado',
    auto_fit_font_size: 'Autoajustar tamaño de fuente',
    scale_text_to_fill: 'Escalar texto para llenar páginas',
    auto_fit: 'Autoajuste',
    auto_fit_is_active: 'Autoajuste activo (hacé clic para tamaño manual)',
    enable_auto_fit: 'Activar autoajuste para llenar páginas',
    auto_balance: 'Balance automático',
    auto_balance_on: 'Balance automático activo (compacto 48px, recortar todo, párrafos enteros) — hacé clic para desactivar',
    auto_balance_desc: 'Balance automático: 1 clic para densidad óptima, márgenes compactos y 100% llenado vertical',
    font_size: 'Tamaño de fuente',
    font_weight: 'Peso de fuente',
    regular_400_only: 'Solo regular 400',
    line_height: 'Interlineado',
    letter_spacing: 'Interletreado',
    weight: 'Peso',
    align_left: 'Alinear a la izquierda',
    align_center: 'Centrar texto',
    align_right: 'Alinear a la derecha',
    align_justify: 'Justificar',
    top: 'Arriba',
    center: 'Centro',
    justify: 'Justificar',
    align_top_tip: 'Alinear texto arriba en el lienzo',
    align_center_tip: 'Centrar texto verticalmente',
    align_justify_tip: 'Justificar texto en la altura del lienzo',
    canvas_format: 'Formato de Lienzo',
    canvas_format_tooltip: 'Cambiar dimensiones y proporción del lienzo',
    card_height_mode: 'Altura de tarjeta',
    trim_all: 'Recortar todo',
    trim_all_desc: 'Ajustá la altura de cada tarjeta al contenido (100% uso, sin espacio vacío)',
    trim_last: 'Recortar última',
    trim_last_desc: 'Las tarjetas 1 a n-1 quedan en 4:5 para carruseles; solo se recorta la última',
    fixed: 'Fijo',
    fixed_desc: 'Dimensiones fijas y estrictas para todas las tarjetas',
    custom_dimensions: 'Dimensiones personalizadas',
    margins_spacing: 'Márgenes y Espaciado',
    margins_tooltip: 'Cambiar márgenes y espaciado de párrafos',
    margins: 'Márgenes',
    compact: 'Compacto',
    generous: 'Generoso',
    paragraph_spacing: 'Espaciado entre párrafos',
    colors: 'Colores',
    colors_tooltip: 'Cambiar color de fondo y color de texto',
    colors_appearance: 'Colores y Apariencia',
    curated_palettes: 'Paletas curadas',
    custom_colors: 'Colores personalizados',
    background: 'Fondo',
    background_desc: 'Relleno del lienzo',
    text_color: 'Color de Texto',
    text_desc: 'Tipografía y encabezados',
    transparent_bg: 'Fondo transparente',
    export_alpha: 'Exportar con canal alfa',
    more: 'Más',
    more_tooltip: 'Más opciones (ajustes, atajos, bloquear diseño, restablecer)',
    system_presets: 'Sistema y Ajustes',
    layout_locked: 'Diseño bloqueado',
    lock_layout: 'Bloquear diseño',
    reset_all_defaults: 'Restablecer todo a valores iniciales',
    reset_confirm: '¿Restablecer todos los ajustes a los valores iniciales?',
    fill_canvas: 'Llenar lienzo',
    fill_canvas_desc: 'Optimizá tamaño de fuente y espaciado para llenar el lienzo',
    author_preferred: 'Preferido del autor',
    author_preferred_desc: 'Restaurá la configuración tipográfica curada',
    reset_all: 'Restablecer todo',
    reset_all_desc: 'Restablecé todos los ajustes a los valores iniciales',

    // Preview & cards
    page_counter: 'Página {current} de {total}',
    copy_text: 'Copiar texto',
    copy_page_text: 'Copiar texto de esta página',
    copied: 'Copiado',
    download: 'Descargar',
    download_page_image: 'Descargar imagen de esta página',
    downloading: 'Descargando...',
    fullscreen: 'Pantalla completa',
    enlarge_preview: 'Agrandar vista previa',
    fit: 'Ajustar',
    fit_desc: 'Ajustar a la ventana',
    zoom_100: '100%',
    zoom_100_desc: 'Ver al 100%',
    prev_page_arrow: 'Página anterior (flecha izquierda)',
    next_page_arrow: 'Página siguiente (flecha derecha)',
    untitled: 'Sin título',
    overflow_badge: 'Desborde ~{px}px',
    page_overflows_by: 'La página {page} desborda por ~{px}px.',
    pages_overflow_bounds: '{count} páginas desbordan los límites del lienzo.',
    auto_fit_text: 'Autoajustar Texto',
    prev: 'Ant',
    next: 'Sig',
    jump_to_page: 'Ir a la Página {page}',
    export_blocked_clipped: 'Exportación bloqueada: la página {page} contiene texto recortado.',
  },
};

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  setLang: () => {},
  toggleLang: () => {},
  t: (key: string) => key,
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
      return text;
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
