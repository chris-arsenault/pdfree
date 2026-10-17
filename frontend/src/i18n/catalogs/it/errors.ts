export const errors = {
  "errors.pngPageLimit":
    "Questa pagina è troppo grande per l’esportazione PNG a 108 dpi. Esportala come PDF per conservarne la risoluzione completa.",
  "errors.editorProvider": "Manca il provider dell’editor.",
  "errors.draftProvider": "Manca il provider delle bozze del documento.",
  "errors.bundledFont":
    "Non è stato possibile caricare un carattere incluso. Ricarica l’applicazione e riprova.",
  "errors.recognitionNotReady": "Il motore di riconoscimento non è ancora pronto.",
  "errors.recognitionWorker": "Il processo di riconoscimento non è riuscito.",
  "errors.recognitionImage": "Non è stato possibile preparare l’immagine per il riconoscimento.",
  "errors.batchSize": "L’output del gruppo supera 128 MB. Elabora meno file alla volta.",
  "errors.batchEmpty": "Non ci sono risultati riusciti da scaricare.",
  "errors.pageImage": "L’esportazione dell’immagine della pagina non è riuscita.",
  "errors.savedDeleted": "Questo documento salvato è stato eliminato.",
  "errors.savedChooseAnother": "Questo documento salvato è stato eliminato. Scegline un altro.",
  "errors.settingSave":
    "Questo browser non ha potuto salvare l’impostazione. La scelta precedente rimane invariata.",
  "errors.scanBlank": "Le pagine vuote inserite non contengono scansioni da analizzare.",
  "errors.offlineRegistration": "Registrazione non riuscita.",
  "errors.signatureType": "Prima digita la tua firma.",
  "errors.signatureCanvas": "L’area di disegno della firma non è disponibile.",
  "errors.signatureChooseImage": "Prima scegli un’immagine della firma.",
  "errors.drawingUnavailable": "Il disegno non è disponibile in questo browser.",
  "errors.signatureDraw": "Prima disegna la tua firma.",
  "errors.signatureImage": "Non è stato possibile creare l’immagine della firma.",
  "errors.sourcePage": "Manca la pagina di origine.",
  "errors.pdfRequest": "Richiesta PDF sconosciuta.",
  "errors.utilityRequest": "Richiesta di strumento sconosciuta.",
  "errors.autosaveDisabled":
    "Il salvataggio automatico dei documenti protetti è disattivato nelle Impostazioni.",
  "errors.pageDimensions":
    "Le dimensioni della pagina e la scala dell’immagine devono essere numeri positivi e finiti.",
  "errors.displayScale": "La scala di visualizzazione non è valida.",
  "errors.imageArchiveSize": "La dimensione dell’archivio di immagini non è valida.",
  "errors.imageArchiveLimit": "Questo archivio PNG supera 128 MB. Esporta meno pagine alla volta.",
  "errors.imageRasterLimit":
    "L’immagine di questa pagina supera 32 megapixel. Riduci la scala dell’immagine.",
  "errors.openProjectSingle": "Apri un solo progetto di modifica alla volta.",
  "progress.preparing": "Preparazione…",
  "progress.image": "Immagine {{index}} di {{count}}",
  "progress.page": "Pagina {{index}} di {{count}}",
  "progress.file": "File {{index}} di {{count}} · {{name}}",
  "progress.analyzing": "Analisi della pagina {{index}} di {{count}}",
  "progress.recognizing": "Riconoscimento della pagina {{index}} di {{count}}",
  "progress.ocrEngine": "Caricamento del motore di riconoscimento",
  "progress.ocrInitialize": "Inizializzazione del motore di riconoscimento",
  "progress.ocrLanguage": "Caricamento della lingua di riconoscimento",
  "progress.ocrReady": "Preparazione del riconoscimento",
  "progress.ocrText": "Riconoscimento del testo",
  "progress.ocrPhase": "{{phase}} · {{percent}}%",
  "errors.blankScanImage": "Le pagine vuote inserite non contengono immagini scansionate.",
  "security.importCanceled": "Apertura del PDF annullata. Il documento attuale è invariato.",
  "security.exportCanceled":
    "Firma o protezione annullata. Non è stato scaricato alcun PDF protetto.",
  "security.importStopped":
    "L’apertura del PDF si è interrotta. Il documento attuale è invariato; riprova.",
  "security.exportStopped":
    "Firma o protezione interrotta. Le modifiche restano disponibili; riprova.",
  "security.importReceive":
    "Non è stato possibile ricevere il PDF sbloccato. Prova ad aprirlo di nuovo.",
  "security.exportReceive":
    "Non è stato possibile ricevere il PDF protetto. Prova a esportarlo di nuovo.",
  "security.importStart": "Non è stato possibile avviare il processo di apertura del PDF.",
  "security.exportStart": "Non è stato possibile avviare il processo di firma o protezione.",
  "errors.workerStopped":
    "Il processo PDF si è interrotto. Le modifiche attuali restano disponibili; riprova.",
  "errors.workerStart": "Non è stato possibile avviare il processo PDF.",
  "password.openRequired": "Inserisci la password di apertura o del proprietario di questo PDF.",
  "password.openIncorrect":
    "Questa password non ha sbloccato il PDF. Prova la password di apertura o del proprietario.",
  "validation.encryptedSource":
    "Le origini cifrate richiedono i byte di lavoro e i metadati di cifratura.",
  "validation.projectEncryptionVersion":
    "Le origini cifrate richiedono la versione 2 del progetto o una successiva.",
  "validation.projectComments": "I progetti della versione 3 richiedono record dei commenti.",
  "validation.projectUtilities":
    "I progetti della versione 4 richiedono record espliciti degli strumenti.",
  "validation.nameRequired": "Assegna un nome al documento.",
  "validation.fieldNameRequired": "Assegna un nome a ogni nuovo campo modulo.",
  "validation.optionLimit": "Usa al massimo {{count}} opzioni.",
  "validation.optionRequired": "Assegna un valore a ogni opzione.",
  "validation.optionUnique": "Ogni opzione deve essere univoca.",
  "validation.fieldRotation":
    "I campi modulo supportano rotazioni di un quarto di giro (multipli di 90°).",
  "validation.radioRotation":
    "I gruppi di pulsanti di opzione supportano una rotazione oggetto di 0°. Ruota invece la pagina.",
  "validation.number": "{{label}} deve essere un numero.",
  "validation.range": "{{label}} deve essere compreso tra {{minimum}} e {{maximum}}.",
  "validation.nameLength": "I nomi dei documenti possono contenere al massimo {{count}} caratteri.",
  "validation.fieldDuplicate": "Il nome del campo {{name}} esiste già. Scegli un nome univoco.",
  "validation.fieldOptions": "Aggiungi opzioni a {{name}}, una per riga.",
  "validation.fieldChoice": "Il valore di {{name}} non corrisponde a nessuna delle sue opzioni.",
  "validation.radioOptions": "Aggiungi pulsanti di opzione a {{name}}, uno per riga.",
  "validation.radioEnlarge":
    "Ingrandisci il gruppo di pulsanti di opzione {{name}} per contenere le sue opzioni.",
  "validation.singleChoice": "Il campo {{name}} accetta una sola opzione selezionata.",
  "validation.checkedValue": "Il valore di {{name}} deve essere selezionato o non selezionato.",
  "validation.textValue": "Il valore di {{name}} deve essere testo.",
  "validation.choiceValue": "Il valore di {{name}} deve essere una scelta.",
  "validation.radioUnsupported":
    "I gruppi di pulsanti di opzione richiedono attualmente una rotazione oggetto pari a zero. La rotazione della pagina è supportata.",
  "errors.destinationCoordinates": "Coordinate di destinazione non supportate.",
  "errors.bookmarkStyle":
    "I segnalibri formattati o collegati alla struttura richiedono la conservazione del catalogo originale.",
  "errors.bookmarkAction": "Azione del segnalibro non supportata.",
  "errors.destinationTree": "Albero delle destinazioni non supportato.",
  "errors.emptyOutline": "Catalogo della struttura vuoto non supportato.",
  "errors.bookmarkDestination": "Destinazione di segnalibro o collegamento non supportata.",
  "errors.bookmarkDepth": "La gerarchia dei segnalibri è troppo profonda.",
  "errors.bookmarkHierarchy": "La gerarchia dei segnalibri non è valida.",
  "errors.sourceLinkMissing": "Manca l’annotazione del collegamento di origine.",
  "errors.commentRequired": "Prima scrivi un commento.",
  "errors.commentLength": "Questo commento è troppo lungo.",
  "errors.commentPageMissing": "La pagina di questo commento non esiste più.",
  "errors.commentLimit": "Usa al massimo 10.000 commenti per pagina.",
  "errors.commentThreadMissing": "La discussione di questo commento non esiste più.",
  "errors.commentTextLimit": "Scrivi un commento di al massimo 100.000 caratteri.",
  "errors.commentReadOnlyThread": "Questa discussione contiene un commento di sola lettura.",
  "errors.commentCircular": "Questo documento contiene una discussione di commenti circolare.",
  "errors.commentMissingThread":
    "Questo documento fa riferimento a una discussione di commenti mancante.",
  "errors.compressionTarget": "Scegli una dimensione obiettivo valida.",
  "errors.annotationComposition":
    "La composizione delle pagine non può conservare le relazioni tra annotazioni su pagine diverse. Esporta invece il documento originale completo.",
  "errors.imageMissing": "Manca un’immagine in questo progetto.",
  "errors.splitOutputRequired": "Scegli almeno un file di output per la divisione.",
  "errors.splitPagesRequired":
    "Ogni file risultante dalla divisione deve contenere almeno una pagina.",
  "errors.splitPageDuplicate": "Scegli ogni pagina una sola volta per file di output.",
  "errors.splitPageOutside": "Una pagina da dividere è fuori dal documento.",
  "errors.commentAnnotationMissing":
    "Questo commento fa riferimento a un’annotazione PDF mancante.",
  "errors.commentReadOnly": "Questo commento PDF è di sola lettura.",
  "errors.commentMarkup": "Questo commento di marcatura non può essere modificato.",
  "errors.commentReplyMissing":
    "Questo commento fa riferimento a una discussione di risposte mancante.",
  "errors.exportPageMissing": "Una pagina da esportare non esiste più.",
  "errors.exportPageDuplicate": "Scegli ogni pagina da esportare una sola volta.",
  "errors.exportPagesRequired": "Scegli almeno una pagina da esportare.",
  "errors.commentGeometry": "Questo commento PDF supera i limiti supportati di testo o coordinate.",
  "errors.commentPageLimit": "Questo PDF contiene più di 10.000 commenti su una pagina.",
  "errors.xfa":
    "Questo documento usa moduli XFA che PDFree non può modificare in sicurezza. Aprilo in un editor compatibile con XFA.",
  "errors.signedInput":
    "Questo PDF contiene campi di firma con certificato. La modifica potrebbe invalidare le firme; usa una copia non firmata.",
  "errors.formControls":
    "Questo PDF contiene controlli modulo non supportati. Usa una copia senza tali controlli.",
  "errors.widgetRotation":
    "Questo PDF contiene un controllo modulo con rotazione non supportata. Usa rotazioni di un quarto di giro.",
  "errors.pdfUnreadable":
    "Non è stato possibile leggere questo file come PDF. Potrebbe essere danneggiato o non supportato.",
  "errors.pageUnits":
    "Questo PDF usa unità di pagina non standard. Convertile in unità di pagina PDF standard prima della modifica.",
  "errors.annotationAppearance":
    "L’annotazione {{type}} non ha un aspetto supportato. La disposizione di più pagine per foglio non può incorporarla in sicurezza.",
  "errors.annotationTransform":
    "La disposizione di più pagine per foglio non può conservare annotazioni con zoom o rotazione fissi.",
  "errors.appearanceGeometry": "La geometria dell’aspetto dell’annotazione non è valida.",
  "errors.appearanceEmpty": "L’aspetto dell’annotazione è vuoto.",
  "errors.printFlatten": "Appiattisci i campi prima di preparare un’impaginazione di stampa.",
  "errors.printMargins": "I margini non lasciano alcuna area stampabile.",
  "errors.keepPage": "Mantieni almeno una pagina oppure apri un nuovo documento.",
  "errors.pageRangeDuplicate":
    "Una pagina compare più di una volta in questo intervallo di output.",
  "errors.pagesRequired": "Scegli almeno una pagina.",
  "errors.rangeInvalid": "Intervallo di pagine non valido: {{range}}. Usa 1-3, 5 o 7-end.",
  "errors.rangeBounds": "L’intervallo di pagine {{range}} deve essere compreso tra 1 e {{count}}.",
  "errors.rangeInteger": "Inserisci un numero intero da 1 a {{count}}.",
  "errors.openFirst": "Prima apri un PDF.",
  "errors.ruleHeight":
    "Il testo della regola di pagina è troppo alto per questa pagina. Usa un carattere più piccolo.",
  "errors.ruleFont":
    "Il testo della regola di pagina contiene caratteri non supportati dal font PDF.",
  "errors.ruleWidth":
    "Il testo della regola di pagina è troppo largo per questa pagina. Usa un carattere più piccolo o un testo più breve.",
  "errors.scopeRange": "Inserisci pagine come 1-3, 5.",
  "errors.imageDepth": "L’annidamento delle risorse di immagine è troppo profondo.",
  "errors.imageEncoding":
    "Questa codifica, questo spazio colore o questa maschera di immagine non può essere elaborata in sicurezza.",
  "errors.imageUnavailable": "L’elaborazione delle immagini non è disponibile in questo browser.",
  "errors.scanDataLength": "Lunghezza inattesa dei dati dell’immagine scansionata.",
  "errors.scanSingleImage":
    "La pulizia richiede un’unica immagine scansionata diretta per pagina; le impaginazioni miste non sono supportate.",
  "errors.scanColor":
    "Questa pagina non contiene un’immagine scansionata RGB o in scala di grigi supportata.",
  "errors.scanStream": "Flusso di contenuto della scansione non supportato.",
  "errors.scanBudget": "Il contenuto scansionato supera il limite di elaborazione.",
  "errors.scanMixedLayout": "La pulizia non può conservare questa impaginazione mista.",
  "errors.scanImageUpright": "La pulizia richiede un’immagine posizionata senza rotazione.",
  "errors.scanTransformUpright":
    "La pulizia richiede trasformazioni di immagine e pagina senza rotazione.",
  "errors.recipientCount":
    "Scegli da 1 a 32 certificati destinatario, ciascuno di al massimo 2 MiB.",
  "errors.ownerPasswordRequired":
    "Inserisci una password del proprietario per controllare i permessi PDF.",
  "errors.passwordsDifferent":
    "Usa password di apertura e del proprietario diverse; quella del proprietario aggira le restrizioni.",
  "errors.passwordByteLimit": "Le password PDF non devono superare 127 byte UTF-8.",
  "errors.passwordNull": "Le password PDF non possono contenere un carattere nullo.",
  "errors.permissions": "Scegli permessi PDF validi.",
  "errors.certificateFile": "Scegli un certificato PKCS#12 (.p12/.pfx) di al massimo 2 MiB.",
  "errors.certificationPolicy": "Scegli un criterio di certificazione PDF valido.",
  "errors.signingMetadataLength":
    "Il motivo e il luogo della firma non devono superare 1024 caratteri.",
  "errors.certificatePasswordLength":
    "Le password dei certificati non devono superare 1024 caratteri.",
  "errors.projectArchiveSize": "Questo progetto ha dimensioni di archivio non valide.",
  "errors.projectArchiveLimit":
    "Questo progetto supera il limite di archivio di 256 MB. Salva meno PDF di origine.",
  "errors.projectExpandedLimit":
    "Questo progetto supera la dimensione supportata dopo l’estrazione.",
  "errors.projectManifestLimit": "Il manifesto di questo progetto è troppo grande.",
  "errors.projectEncryptedBytes":
    "Le origini cifrate richiedono i byte originali e quelli di lavoro decifrati.",
  "errors.projectObjectIdentities": "Questo progetto contiene identificatori di oggetto duplicati.",
  "errors.projectFieldMissing": "Questo progetto fa riferimento a un campo modulo mancante.",
  "errors.projectPageMissing": "Questo progetto fa riferimento a una pagina PDF mancante.",
  "errors.projectImageMissing": "Questo progetto fa riferimento a un’immagine mancante.",
  "errors.projectAnnotationsDuplicate":
    "Questo progetto contiene riferimenti ad annotazioni duplicati.",
  "errors.projectFileMissing": "In questo progetto manca {{path}}.",
  "errors.projectVersion": "Questo non è un progetto PDFree supportato della versione 1, 2, 3 o 4.",
  "errors.projectJson": "Il manifesto di questo progetto non è un JSON valido.",
  "errors.projectSave": "Impossibile salvare questo progetto di modifica: {{path}} — {{details}}",
  "errors.projectInvalidValue": "Valore di progetto non valido.",
  "errors.encryptionKeyLength": "Lunghezza della chiave di cifratura a chiave pubblica non valida.",
  "errors.encryptionVersion": "Versione della cifratura a chiave pubblica non supportata.",
  "errors.encryptionSubfilter": "Sottofiltro PDF a chiave pubblica non supportato.",
  "errors.cryptMethod": "Metodo del filtro crittografico a chiave pubblica non supportato.",
  "errors.cryptKeyLength":
    "Lunghezza della chiave del filtro crittografico a chiave pubblica non valida.",
  "errors.cryptFilter": "Filtro crittografico a chiave pubblica non valido.",
  "errors.recipientIdentityRequired":
    "Seleziona un’identità destinatario .p12 o .pfx e inserisci la sua password.",
  "errors.cryptFilterMissing": "Il PDF fa riferimento a un filtro crittografico mancante.",
  "errors.recipientContentMissing": "Il PDF non contiene contenuto cifrato per destinatari.",
  "errors.oaepParameters": "Parametri RSA-OAEP non supportati",
  "errors.rc2KeyLength": "Lunghezza effettiva della chiave RC2 non supportata",
  "errors.rc2Iv": "Manca il vettore di inizializzazione RC2",
  "errors.recipientEncryption": "Cifratura del contenuto per destinatari non supportata",
  "errors.envelopeContent": "Manca il contenuto cifrato della busta",
  "errors.envelopePadding": "Riempimento della busta destinatario non valido",
  "errors.rsaPrivateKey": "È richiesta una chiave privata RSA",
  "errors.recipientTransport": "Trasporto della chiave destinatario non supportato",
  "errors.envelopeType": "La voce destinatario non è CMS EnvelopedData",
  "errors.recipientSeed": "Dimensione del seme destinatario non valida",
  "errors.recipientDecrypt":
    "Questa identità non ha potuto decifrare una voce destinatario. Seleziona l’identità destinatario corrispondente.",
  "errors.certificateMissing": "Manca il certificato",
  "errors.certificateKeyMissing": "Manca il certificato o la chiave privata",
  "errors.recipientUnlock":
    "Non è stato possibile sbloccare l’identità destinatario. Verifica password, certificato e chiave privata.",
  "errors.recipientList": "L’elenco dei destinatari del PDF manca o è vuoto.",
  "errors.recipientEntry": "Il PDF contiene una voce destinatario non valida.",
  "errors.recipientUnauthorized":
    "Questa identità non è un destinatario autorizzato. Seleziona il file .p12 o .pfx corrispondente.",
  "errors.recipientPem": "Non è stato possibile leggere il certificato PEM del destinatario.",
  "errors.recipientCertificate":
    "Scegli certificati X.509 dei destinatari (.cer, .crt o .pem), senza chiavi private.",
  "errors.recipientKeyUnsupported":
    "La chiave di cifratura di questo destinatario non è supportata.",
  "errors.recipientEncrypt": "La chiave del destinatario non ha potuto cifrare questo PDF.",
  "errors.recognitionFont":
    "Il testo riconosciuto contiene una scrittura non supportata dal font PDF incluso. Controlla il riconoscimento prima di esportare.",
  "errors.projectSourceLink":
    "Questo progetto fa riferimento a un collegamento di origine non supportato.",
  "errors.projectCommentMissing": "Questo progetto fa riferimento a un commento PDF mancante.",
  "errors.projectReadOnlyComment": "Questo progetto modifica un commento PDF di sola lettura.",
  "errors.projectCommentProperties":
    "Questo progetto modifica proprietà non supportate di un commento di origine.",
  "errors.scanSource": "La pulizia richiede una pagina di origine.",
  "errors.selectedPageMissing": "Una pagina selezionata non esiste più.",
  "errors.cropMargins": "I margini di ritaglio devono lasciare contenuto visibile nella pagina.",
  "errors.deskewAnnotations":
    "Raddrizza le pagine prima di aggiungere commenti o campi; la geometria delle loro annotazioni non può essere ruotata in sicurezza.",
  "errors.cleanedImageMissing": "Manca l’immagine della scansione pulita.",
  "errors.recipientX509Count":
    "Scegli da 1 a 32 certificati X.509 dei destinatari, ciascuno di al massimo 2 MiB.",
  "errors.passwordConfirmations":
    "Le conferme delle password di apertura e del proprietario devono corrispondere.",
  "errors.selectText": "Prima seleziona del testo sulla pagina PDF.",
  "errors.signaturePlaceholderMissing":
    "Non è stato possibile trovare il segnaposto della firma PDF.",
  "errors.signaturePlaceholderInvalid": "Il segnaposto della firma PDF non è valido.",
  "errors.signatureByteRange": "Il PDF è troppo grande per l’intervallo di byte della sua firma.",
  "errors.signatureSpace": "La catena di certificati supera lo spazio della firma PDF.",
  "errors.signatureRequirements":
    "Questo campo firma richiede valori iniziali o blocchi dei campi che PDFree non può rispettare in sicurezza. Usa una copia senza tali requisiti.",
  "errors.signatureUnsigned":
    "Usa un PDF non firmato per aggiungere una firma o certificazione PDFree.",
  "errors.pdfCatalogMissing": "Manca il riferimento al catalogo PDF.",
  "errors.signingAlgorithm":
    "L’algoritmo di firma di questo certificato non è supportato. Usa RSA o ECDSA.",
  "errors.signingCertificateRead": "Non è stato possibile leggere il certificato di firma.",
  "errors.signingCertificateValidity": "Il certificato di firma è scaduto o non è ancora valido.",
  "errors.signingKeyUsageRead":
    "Non è stato possibile leggere l’uso della chiave del certificato di firma.",
  "errors.signingKeyUsage": "Questo certificato non consente firme digitali.",
  "errors.signingIdentityUnlock":
    "Non è stato possibile sbloccare il file PKCS#12. Verifica password, certificato e chiave privata.",
  "errors.signingKeyMismatch": "Il certificato non corrisponde alla sua chiave privata.",
  "errors.textFont":
    "{{label}} contiene caratteri che questo font non può esportare: {{characters}}. Scegli un font supportato o importa un’immagine della firma.",
  "errors.textBox":
    "Il testo «{{label}}» non entra nel riquadro. Ingrandisci il riquadro o riduci il carattere prima di esportare.",
  "errors.encryptionHandler": "Questo PDF usa un gestore di cifratura non supportato o non valido.",
  "errors.bookmarkIdentities": "Identificatori di segnalibro duplicati.",
  "errors.pageRulesDuplicate": "Regole di pagina duplicate.",
  "errors.pageRuleTarget": "Una regola di pagina punta a una pagina mancante.",
  "errors.bookmarkTarget": "Un segnalibro punta a una pagina mancante.",
  "errors.scanAssetMissing": "Manca l’immagine della scansione elaborata.",
  "errors.deskewDestination":
    "Il raddrizzamento non può conservare questa destinazione posizionata di segnalibro o collegamento. Usa prima una destinazione di pagina intera.",
  "errors.fieldWidgetRotation": "Questo controllo modulo usa una rotazione non supportata.",
} as const;
