export const errors = {
  "errors.deskewDestination":
    "El enderezado no puede conservar este destino de marcador o enlace con posición. Usa primero un destino de página completa.",
  "errors.fieldWidgetRotation": "Este control de formulario usa una rotación no compatible.",
  "errors.commentReadOnlyThread": "Este hilo contiene un comentario de solo lectura.",
  "errors.commentCircular": "Este documento tiene un hilo de comentarios circular.",
  "errors.commentMissingThread":
    "Este documento hace referencia a un hilo de comentarios inexistente.",
  "errors.compressionTarget": "Elige un tamaño de destino válido.",
  "errors.annotationComposition":
    "La composición de páginas no puede conservar las relaciones entre anotaciones de distintas páginas. Exporta el documento original completo.",
  "errors.imageMissing": "Falta una imagen en este proyecto.",
  "errors.splitOutputRequired": "Elige al menos un archivo de salida para la división.",
  "errors.splitPagesRequired":
    "Cada archivo resultante de la división debe contener al menos una página.",
  "errors.splitPageDuplicate": "Elige cada página una sola vez por archivo de salida.",
  "errors.splitPageOutside": "Una página de la división está fuera del documento.",
  "errors.commentAnnotationMissing":
    "Este comentario hace referencia a una anotación de PDF inexistente.",
  "errors.commentReadOnly": "Este comentario de PDF es de solo lectura.",
  "errors.commentMarkup": "No se puede editar este comentario de marcado.",
  "errors.commentReplyMissing":
    "Este comentario hace referencia a un hilo de respuestas inexistente.",
  "errors.exportPageMissing": "Una página para exportar ya no existe.",
  "errors.exportPageDuplicate": "Elige cada página para exportar una sola vez.",
  "errors.exportPagesRequired": "Elige al menos una página para exportar.",
  "errors.commentGeometry":
    "Este comentario de PDF supera los límites admitidos de texto o coordenadas.",
  "errors.commentPageLimit": "Este PDF contiene más de 10.000 comentarios en una página.",
  "errors.xfa":
    "Este documento usa formularios XFA que PDFree no puede editar de forma segura. Ábrelo en un editor compatible con XFA.",
  "errors.signedInput":
    "Este PDF tiene campos de firma con certificado. Editarlo podría invalidar las firmas; usa una copia sin firmar.",
  "errors.formControls":
    "Este PDF contiene controles de formulario no compatibles. Usa una copia sin esos controles.",
  "errors.widgetRotation":
    "Este PDF contiene un control de formulario con una rotación no compatible. Usa giros de un cuarto de vuelta.",
  "errors.pdfUnreadable":
    "No se pudo leer este archivo como PDF. Puede estar dañado o no ser compatible.",
  "errors.pageUnits":
    "Este PDF usa unidades de página no estándar. Conviértelas a unidades de página PDF estándar antes de editar.",
  "errors.annotationAppearance":
    "La anotación {{type}} no tiene una apariencia compatible. La disposición de varias páginas por hoja no puede incorporarla de forma segura.",
  "errors.annotationTransform":
    "La disposición de varias páginas por hoja no puede conservar anotaciones con zoom o rotación fijos.",
  "errors.appearanceGeometry": "La geometría de apariencia de la anotación no es válida.",
  "errors.appearanceEmpty": "La apariencia de la anotación está vacía.",
  "errors.printFlatten": "Aplana los campos antes de preparar una disposición de impresión.",
  "errors.printMargins": "Los márgenes no dejan área imprimible.",
  "errors.keepPage": "Conserva al menos una página o abre un nuevo documento.",
  "errors.pageRangeDuplicate": "Una página aparece más de una vez en este intervalo de salida.",
  "errors.pagesRequired": "Elige al menos una página.",
  "errors.rangeInvalid": "Intervalo de páginas no válido: {{range}}. Usa 1-3, 5 o 7-end.",
  "errors.rangeBounds": "El intervalo de páginas {{range}} debe estar entre 1 y {{count}}.",
  "errors.rangeInteger": "Introduce un número entero entre 1 y {{count}}.",
  "errors.openFirst": "Abre primero un PDF.",
  "errors.ruleHeight":
    "El texto de la regla de página es demasiado alto para esta página. Usa una fuente más pequeña.",
  "errors.ruleFont":
    "El texto de la regla de página contiene caracteres no compatibles con la fuente del PDF.",
  "errors.ruleWidth":
    "El texto de la regla de página es demasiado ancho para esta página. Usa una fuente más pequeña o una etiqueta más corta.",
  "errors.scopeRange": "Introduce páginas como 1-3, 5.",
  "errors.imageDepth": "El anidamiento de recursos de imagen es demasiado profundo.",
  "errors.imageEncoding":
    "No se pueden procesar de forma segura esta codificación, espacio de color o máscara de imagen.",
  "errors.imageUnavailable": "Este navegador no permite procesar imágenes.",
  "errors.scanDataLength": "La longitud de los datos de la imagen escaneada no es la esperada.",
  "errors.scanSingleImage":
    "La limpieza de escaneos requiere una única imagen escaneada directa por página; no admite disposiciones mixtas.",
  "errors.scanColor":
    "Esta página no contiene una imagen escaneada RGB o en escala de grises compatible.",
  "errors.scanStream": "Flujo de contenido escaneado no compatible.",
  "errors.scanBudget": "El contenido escaneado supera el límite de procesamiento.",
  "errors.scanMixedLayout":
    "La limpieza de escaneos no puede conservar esta disposición mixta de página.",
  "errors.scanImageUpright": "La limpieza de escaneos requiere una imagen colocada sin girar.",
  "errors.scanTransformUpright":
    "La limpieza de escaneos requiere que las transformaciones de imagen y página estén sin girar.",
  "errors.recipientCount":
    "Elige entre 1 y 32 certificados de destinatario, de un máximo de 2 MiB cada uno.",
  "errors.ownerPasswordRequired":
    "Introduce una contraseña de propietario para controlar los permisos del PDF.",
  "errors.passwordsDifferent":
    "Usa contraseñas de apertura y de propietario diferentes; la de propietario permite omitir las restricciones.",
  "errors.passwordByteLimit": "Las contraseñas de PDF no pueden superar los 127 bytes UTF-8.",
  "errors.passwordNull": "Las contraseñas de PDF no pueden contener un carácter nulo.",
  "errors.permissions": "Elige permisos de PDF válidos.",
  "errors.certificateFile": "Elige un certificado PKCS#12 (.p12/.pfx) de un máximo de 2 MiB.",
  "errors.certificationPolicy": "Elige una política válida de certificación del PDF.",
  "errors.signingMetadataLength":
    "El motivo y la ubicación de la firma no pueden superar los 1024 caracteres.",
  "errors.certificatePasswordLength":
    "Las contraseñas de certificado no pueden superar los 1024 caracteres.",
  "errors.projectArchiveSize": "Los tamaños del archivo de este proyecto no son válidos.",
  "errors.projectArchiveLimit":
    "Este proyecto supera el límite de archivo de 256 MB. Guarda menos PDF de origen.",
  "errors.projectExpandedLimit": "Este proyecto supera el tamaño admitido al descomprimirse.",
  "errors.projectManifestLimit": "El manifiesto de este proyecto es demasiado grande.",
  "errors.projectEncryptedBytes":
    "Los archivos de origen cifrados necesitan sus bytes originales y los bytes de trabajo descifrados.",
  "errors.projectObjectIdentities": "Este proyecto tiene identificadores de objeto duplicados.",
  "errors.projectFieldMissing":
    "Este proyecto hace referencia a un campo de formulario inexistente.",
  "errors.projectPageMissing": "Este proyecto hace referencia a una página PDF inexistente.",
  "errors.projectImageMissing": "Este proyecto hace referencia a una imagen inexistente.",
  "errors.projectAnnotationsDuplicate": "Este proyecto tiene referencias de anotación duplicadas.",
  "errors.projectFileMissing": "A este proyecto le falta {{path}}.",
  "errors.projectVersion":
    "Este proyecto no es un proyecto PDFree compatible de la versión 1, 2, 3 o 4.",
  "errors.projectJson": "El manifiesto de este proyecto no es un JSON válido.",
  "errors.projectSave": "No se puede guardar este proyecto de edición: {{path}} — {{details}}",
  "errors.projectInvalidValue": "Valor de proyecto no válido.",
  "errors.encryptionKeyLength": "Longitud de clave de cifrado de clave pública no válida.",
  "errors.encryptionVersion": "Versión de cifrado de clave pública no compatible.",
  "errors.encryptionSubfilter": "Subfiltro de PDF de clave pública no compatible.",
  "errors.cryptMethod": "Método de filtro criptográfico de clave pública no compatible.",
  "errors.cryptKeyLength": "Longitud de clave del filtro criptográfico de clave pública no válida.",
  "errors.cryptFilter": "Filtro criptográfico de clave pública no válido.",
  "errors.recipientIdentityRequired":
    "Selecciona una identidad de destinatario .p12 o .pfx e introduce su contraseña.",
  "errors.cryptFilterMissing": "El PDF hace referencia a un filtro criptográfico inexistente.",
  "errors.recipientContentMissing": "El PDF no contiene contenido cifrado para destinatarios.",
  "errors.oaepParameters": "Parámetros RSA-OAEP no compatibles",
  "errors.rc2KeyLength": "Longitud de clave efectiva RC2 no compatible",
  "errors.rc2Iv": "Falta el vector de inicialización RC2",
  "errors.recipientEncryption": "Cifrado de contenido para destinatarios no compatible",
  "errors.envelopeContent": "Falta el contenido cifrado del sobre",
  "errors.envelopePadding": "Relleno del sobre de destinatario no válido",
  "errors.rsaPrivateKey": "Se requiere una clave privada RSA",
  "errors.recipientTransport": "Transporte de clave de destinatario no compatible",
  "errors.envelopeType": "La entrada de destinatario no es CMS EnvelopedData",
  "errors.recipientSeed": "Tamaño de semilla de destinatario no válido",
  "errors.recipientDecrypt":
    "Esta identidad no pudo descifrar una entrada de destinatario. Selecciona la identidad de destinatario correspondiente.",
  "errors.certificateMissing": "Falta el certificado",
  "errors.certificateKeyMissing": "Falta el certificado o la clave privada",
  "errors.recipientUnlock":
    "No se pudo desbloquear la identidad de destinatario. Comprueba su contraseña, certificado y clave privada.",
  "errors.recipientList": "Falta la lista de destinatarios del PDF o está vacía.",
  "errors.recipientEntry": "El PDF contiene una entrada de destinatario no válida.",
  "errors.recipientUnauthorized":
    "Esta identidad no es un destinatario autorizado. Selecciona su archivo .p12 o .pfx correspondiente.",
  "errors.recipientPem": "No se pudo leer el certificado PEM del destinatario.",
  "errors.recipientCertificate":
    "Elige certificados X.509 de destinatario (.cer, .crt o .pem), sin claves privadas.",
  "errors.recipientKeyUnsupported": "La clave de cifrado de este destinatario no es compatible.",
  "errors.recipientEncrypt": "La clave del destinatario no pudo cifrar este PDF.",
  "errors.recognitionFont":
    "El texto reconocido contiene una escritura no compatible con la fuente PDF incluida. Revisa el reconocimiento antes de exportar.",
  "errors.projectSourceLink": "Este proyecto hace referencia a un enlace de origen no compatible.",
  "errors.projectCommentMissing": "Este proyecto hace referencia a un comentario PDF inexistente.",
  "errors.projectReadOnlyComment": "Este proyecto modifica un comentario PDF de solo lectura.",
  "errors.projectCommentProperties":
    "Este proyecto modifica propiedades no compatibles de un comentario de origen.",
  "errors.scanSource": "La limpieza de escaneos requiere una página de origen.",
  "errors.selectedPageMissing": "Una página seleccionada ya no existe.",
  "errors.cropMargins": "Los márgenes de recorte deben dejar contenido de página visible.",
  "errors.deskewAnnotations":
    "Endereza las páginas antes de añadir comentarios o campos; no se puede girar la geometría de sus anotaciones de forma segura.",
  "errors.cleanedImageMissing": "Falta la imagen del escaneo limpio.",
  "errors.recipientX509Count":
    "Elige entre 1 y 32 certificados X.509 de destinatario, de un máximo de 2 MiB cada uno.",
  "errors.passwordConfirmations":
    "Las confirmaciones de las contraseñas de apertura y de propietario deben coincidir.",
  "errors.selectText": "Selecciona primero texto en la página PDF.",
  "errors.signaturePlaceholderMissing":
    "No se pudo localizar el marcador de posición de la firma del PDF.",
  "errors.signaturePlaceholderInvalid": "El marcador de posición de la firma del PDF no es válido.",
  "errors.signatureByteRange": "El PDF es demasiado grande para el intervalo de bytes de su firma.",
  "errors.signatureSpace": "La cadena de certificados supera el espacio de firma del PDF.",
  "errors.signatureRequirements":
    "Este campo de firma requiere valores iniciales o bloqueos de campos que PDFree no puede respetar de forma segura. Usa una copia sin esos requisitos.",
  "errors.signatureUnsigned":
    "Usa un PDF sin firmar para añadir una firma o certificación de PDFree.",
  "errors.pdfCatalogMissing": "Falta la referencia al catálogo del PDF.",
  "errors.signingAlgorithm":
    "El algoritmo de firma de este certificado no es compatible. Usa RSA o ECDSA.",
  "errors.signingCertificateRead": "No se pudo leer el certificado de firma.",
  "errors.signingCertificateValidity":
    "El certificado de firma ha caducado o todavía no es válido.",
  "errors.signingKeyUsageRead": "No se pudo leer el uso de clave del certificado de firma.",
  "errors.signingKeyUsage": "Este certificado no permite firmas digitales.",
  "errors.signingIdentityUnlock":
    "No se pudo desbloquear el archivo PKCS#12. Comprueba su contraseña, certificado y clave privada.",
  "errors.signingKeyMismatch": "El certificado no corresponde a su clave privada.",
  "errors.textFont":
    "{{label}} contiene caracteres que esta fuente no puede exportar: {{characters}}. Elige una fuente compatible o importa una imagen de firma.",
  "errors.textBox":
    "El texto «{{label}}» no cabe en su cuadro. Amplía el cuadro o reduce el tamaño de fuente antes de exportar.",
  "errors.encryptionHandler": "Este PDF usa un controlador de cifrado no compatible o no válido.",
  "errors.bookmarkIdentities": "Identificadores de marcador duplicados.",
  "errors.pageRulesDuplicate": "Reglas de página duplicadas.",
  "errors.pageRuleTarget": "Una regla de página apunta a una página inexistente.",
  "errors.bookmarkTarget": "Un marcador apunta a una página inexistente.",
  "errors.scanAssetMissing": "Falta la imagen del escaneo procesado.",
  "errors.pngPageLimit":
    "Esta página es demasiado grande para exportarla como PNG a 108 ppp. Expórtala como PDF para conservar toda su resolución.",
  "errors.editorProvider": "Falta el proveedor del editor.",
  "errors.draftProvider": "Falta el proveedor de borradores del documento.",
  "errors.bundledFont":
    "No se pudo cargar una fuente incluida. Recarga la aplicación e inténtalo de nuevo.",
  "errors.recognitionNotReady": "El motor de reconocimiento todavía no está listo.",
  "errors.recognitionWorker": "Falló el proceso de reconocimiento.",
  "errors.recognitionImage": "No se pudo preparar la imagen para el reconocimiento.",
  "errors.batchSize": "El resultado del lote supera los 128 MB. Procesa menos archivos a la vez.",
  "errors.batchEmpty": "No hay resultados correctos para descargar.",
  "errors.pageImage": "Falló la exportación de la imagen de la página.",
  "errors.savedDeleted": "Se ha eliminado este documento guardado.",
  "errors.savedChooseAnother": "Se ha eliminado este documento guardado. Elige otro documento.",
  "errors.settingSave":
    "Este navegador no pudo guardar el ajuste. Se conserva tu elección anterior.",
  "errors.scanBlank": "Las páginas en blanco insertadas no tienen un escaneo que analizar.",
  "errors.offlineRegistration": "Falló el registro.",
  "errors.signatureType": "Escribe primero tu firma.",
  "errors.signatureCanvas": "El lienzo de firmas no está disponible.",
  "errors.signatureChooseImage": "Elige primero una imagen de firma.",
  "errors.drawingUnavailable": "Este navegador no permite dibujar.",
  "errors.signatureDraw": "Dibuja primero tu firma.",
  "errors.signatureImage": "No se pudo crear la imagen de la firma.",
  "errors.sourcePage": "Falta la página de origen.",
  "errors.pdfRequest": "Solicitud de PDF desconocida.",
  "errors.utilityRequest": "Solicitud de herramienta desconocida.",
  "errors.autosaveDisabled":
    "El guardado automático de documentos protegidos está desactivado en Ajustes.",
  "errors.pageDimensions":
    "Las dimensiones de la página y la escala de la imagen deben ser números positivos y finitos.",
  "errors.displayScale": "La escala de visualización no es válida.",
  "errors.imageArchiveSize": "El tamaño del archivo de imágenes no es válido.",
  "errors.imageArchiveLimit":
    "Este archivo de PNG supera los 128 MB. Exporta menos páginas a la vez.",
  "errors.imageRasterLimit":
    "La imagen de esta página supera los 32 megapíxeles. Reduce la escala de la imagen.",
  "errors.openProjectSingle": "Abre un solo proyecto de edición a la vez.",
  "progress.preparing": "Preparando…",
  "progress.image": "Imagen {{index}} de {{count}}",
  "progress.page": "Página {{index}} de {{count}}",
  "progress.file": "Archivo {{index}} de {{count}} · {{name}}",
  "progress.analyzing": "Analizando la página {{index}} de {{count}}",
  "progress.recognizing": "Reconociendo la página {{index}} de {{count}}",
  "progress.ocrEngine": "Cargando el motor de reconocimiento",
  "progress.ocrInitialize": "Inicializando el motor de reconocimiento",
  "progress.ocrLanguage": "Cargando el idioma de reconocimiento",
  "progress.ocrReady": "Preparando el reconocimiento",
  "progress.ocrText": "Reconociendo texto",
  "progress.ocrPhase": "{{phase}} · {{percent}}%",
  "errors.blankScanImage": "Las páginas en blanco insertadas no tienen una imagen escaneada.",
  "security.importCanceled": "Se canceló la apertura del PDF. Tu documento actual no ha cambiado.",
  "security.exportCanceled":
    "Se canceló la firma o protección. No se descargó ningún PDF protegido.",
  "security.importStopped":
    "Se detuvo la apertura del PDF. Tu documento actual no ha cambiado; inténtalo de nuevo.",
  "security.exportStopped":
    "Se detuvo la firma o protección. Tus cambios siguen disponibles; inténtalo de nuevo.",
  "security.importReceive": "No se pudo recibir el PDF desbloqueado. Intenta abrirlo de nuevo.",
  "security.exportReceive": "No se pudo recibir el PDF protegido. Intenta exportarlo de nuevo.",
  "security.importStart": "No se pudo iniciar el proceso de apertura del PDF.",
  "security.exportStart": "No se pudo iniciar el proceso de firma o protección.",
  "errors.workerStopped":
    "Se detuvo el proceso del PDF. Tus cambios actuales siguen disponibles; inténtalo de nuevo.",
  "errors.workerStart": "No se pudo iniciar el proceso del PDF.",
  "password.openRequired": "Introduce la contraseña de apertura o de propietario de este PDF.",
  "password.openIncorrect":
    "Esa contraseña no desbloqueó este PDF. Prueba su contraseña de apertura o de propietario.",
  "validation.encryptedSource":
    "Los archivos de origen cifrados necesitan bytes de trabajo y metadatos de cifrado.",
  "validation.projectEncryptionVersion":
    "Los archivos de origen cifrados requieren la versión 2 del proyecto o posterior.",
  "validation.projectComments": "Los proyectos de la versión 3 requieren registros de comentarios.",
  "validation.projectUtilities":
    "Los proyectos de la versión 4 requieren registros explícitos de herramientas.",
  "validation.nameRequired": "Ponle un nombre al documento.",
  "validation.fieldNameRequired": "Ponle un nombre a cada nuevo campo de formulario.",
  "validation.optionLimit": "Usa como máximo {{count}} opciones.",
  "validation.optionRequired": "Asigna un valor a cada opción.",
  "validation.optionUnique": "Cada opción debe ser única.",
  "validation.fieldRotation":
    "Los campos de formulario admiten giros de un cuarto de vuelta (múltiplos de 90°).",
  "validation.radioRotation":
    "Los grupos de botones de opción admiten una rotación de objeto de 0°. Gira la página en su lugar.",
  "validation.number": "{{label}} debe ser un número.",
  "validation.range": "{{label}} debe estar entre {{minimum}} y {{maximum}}.",
  "validation.nameLength":
    "Los nombres de documento pueden tener como máximo {{count}} caracteres.",
  "validation.fieldDuplicate": "Ya existe el nombre de campo {{name}}. Elige un nombre único.",
  "validation.fieldOptions": "Añade opciones a {{name}}, una por línea.",
  "validation.fieldChoice": "El valor de {{name}} no corresponde a ninguna de sus opciones.",
  "validation.radioOptions": "Añade botones de opción a {{name}}, uno por línea.",
  "validation.radioEnlarge":
    "Amplía el grupo de botones de opción {{name}} para que quepan sus opciones.",
  "validation.singleChoice": "El campo {{name}} solo admite una opción seleccionada.",
  "validation.checkedValue": "El valor de {{name}} debe ser marcado o desmarcado.",
  "validation.textValue": "El valor de {{name}} debe ser texto.",
  "validation.choiceValue": "El valor de {{name}} debe ser una opción.",
  "validation.radioUnsupported":
    "Por ahora, los grupos de botones de opción requieren una rotación de objeto de cero. Se puede girar la página.",
  "errors.destinationCoordinates": "Coordenadas de destino no compatibles.",
  "errors.bookmarkStyle":
    "Los marcadores con estilo o vinculados a la estructura requieren conservar el catálogo original.",
  "errors.bookmarkAction": "Acción de marcador no compatible.",
  "errors.destinationTree": "Árbol de destinos no compatible.",
  "errors.emptyOutline": "Catálogo de esquema vacío no compatible.",
  "errors.bookmarkDestination": "Destino de marcador o enlace no compatible.",
  "errors.bookmarkDepth": "La jerarquía de marcadores es demasiado profunda.",
  "errors.bookmarkHierarchy": "La jerarquía de marcadores no es válida.",
  "errors.sourceLinkMissing": "Falta la anotación del enlace de origen.",
  "errors.commentRequired": "Escribe primero un comentario.",
  "errors.commentLength": "Este comentario es demasiado largo.",
  "errors.commentPageMissing": "La página de este comentario ya no existe.",
  "errors.commentLimit": "Usa como máximo 10.000 comentarios por página.",
  "errors.commentThreadMissing": "El hilo de este comentario ya no existe.",
  "errors.commentTextLimit": "Escribe un comentario de como máximo 100.000 caracteres.",
} as const;
