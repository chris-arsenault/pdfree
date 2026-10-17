export const errors = {
  "errors.recipientCount": "Wählen Sie 1 bis 32 Empfängerzertifikate mit jeweils höchstens 2 MiB.",
  "errors.ownerPasswordRequired":
    "Geben Sie ein Eigentümerpasswort ein, um die PDF-Berechtigungen zu steuern.",
  "errors.passwordsDifferent":
    "Verwenden Sie unterschiedliche Öffnungs- und Eigentümerpasswörter; das Eigentümerpasswort umgeht Einschränkungen.",
  "errors.passwordByteLimit": "PDF-Passwörter dürfen höchstens 127 UTF-8-Bytes lang sein.",
  "errors.passwordNull": "PDF-Passwörter dürfen kein Nullzeichen enthalten.",
  "errors.permissions": "Wählen Sie gültige PDF-Berechtigungen.",
  "errors.certificateFile": "Wählen Sie ein PKCS#12-Zertifikat (.p12/.pfx) mit höchstens 2 MiB.",
  "errors.certificationPolicy": "Wählen Sie eine gültige PDF-Zertifizierungsrichtlinie.",
  "errors.signingMetadataLength": "Signaturgrund und -ort dürfen höchstens 1024 Zeichen lang sein.",
  "errors.certificatePasswordLength":
    "Zertifikatspasswörter dürfen höchstens 1024 Zeichen lang sein.",
  "errors.projectArchiveSize": "Dieses Projekt enthält ungültige Archivgrößen.",
  "errors.projectArchiveLimit":
    "Dieses Projekt überschreitet die Archivgrenze von 256 MB. Speichern Sie weniger Quell-PDFs.",
  "errors.projectExpandedLimit":
    "Dieses Projekt überschreitet nach dem Entpacken die unterstützte Größe.",
  "errors.projectManifestLimit": "Das Manifest dieses Projekts ist zu groß.",
  "errors.projectEncryptedBytes":
    "Verschlüsselte Quellen benötigen ihre ursprünglichen und entschlüsselten Arbeitsdaten.",
  "errors.projectObjectIdentities": "Dieses Projekt enthält doppelte Objektkennungen.",
  "errors.projectFieldMissing": "Dieses Projekt verweist auf ein fehlendes Formularfeld.",
  "errors.projectPageMissing": "Dieses Projekt verweist auf eine fehlende PDF-Seite.",
  "errors.projectImageMissing": "Dieses Projekt verweist auf ein fehlendes Bild.",
  "errors.projectAnnotationsDuplicate": "Dieses Projekt enthält doppelte Anmerkungsverweise.",
  "errors.projectFileMissing": "In diesem Projekt fehlt {{path}}.",
  "errors.projectVersion": "Dies ist kein unterstütztes PDFree-Projekt der Version 1, 2, 3 oder 4.",
  "errors.projectJson": "Das Projektmanifest ist kein gültiges JSON.",
  "errors.projectSave":
    "Dieses Bearbeitungsprojekt kann nicht gespeichert werden: {{path}} — {{details}}",
  "errors.projectInvalidValue": "Ungültiger Projektwert.",
  "errors.encryptionKeyLength":
    "Ungültige Schlüssellänge für die Verschlüsselung mit öffentlichem Schlüssel.",
  "errors.encryptionVersion":
    "Nicht unterstützte Version der Verschlüsselung mit öffentlichem Schlüssel.",
  "errors.encryptionSubfilter": "Nicht unterstützter PDF-Unterfilter für öffentliche Schlüssel.",
  "errors.cryptMethod": "Nicht unterstützte Kryptofiltermethode für öffentliche Schlüssel.",
  "errors.cryptKeyLength": "Ungültige Schlüssellänge des Kryptofilters für öffentliche Schlüssel.",
  "errors.cryptFilter": "Ungültiger Kryptofilter für öffentliche Schlüssel.",
  "errors.recipientIdentityRequired":
    "Wählen Sie eine .p12- oder .pfx-Empfängeridentität und geben Sie ihr Passwort ein.",
  "errors.cryptFilterMissing": "Die PDF verweist auf einen fehlenden Kryptofilter.",
  "errors.recipientContentMissing": "Die PDF enthält keinen verschlüsselten Empfängerinhalt.",
  "errors.oaepParameters": "Nicht unterstützte RSA-OAEP-Parameter",
  "errors.rc2KeyLength": "Nicht unterstützte effektive RC2-Schlüssellänge",
  "errors.rc2Iv": "Der RC2-Initialisierungsvektor fehlt",
  "errors.recipientEncryption": "Nicht unterstützte Verschlüsselung des Empfängerinhalts",
  "errors.envelopeContent": "Der verschlüsselte Hülleninhalt fehlt",
  "errors.envelopePadding": "Ungültiges Padding der Empfängerhülle",
  "errors.rsaPrivateKey": "Ein privater RSA-Schlüssel ist erforderlich",
  "errors.recipientTransport": "Nicht unterstützter Empfängerschlüsseltransport",
  "errors.envelopeType": "Der Empfängereintrag ist kein CMS EnvelopedData",
  "errors.recipientSeed": "Ungültige Größe des Empfänger-Seeds",
  "errors.recipientDecrypt":
    "Diese Identität konnte einen Empfängereintrag nicht entschlüsseln. Wählen Sie die passende Empfängeridentität.",
  "errors.certificateMissing": "Das Zertifikat fehlt",
  "errors.certificateKeyMissing": "Das Zertifikat oder der private Schlüssel fehlt",
  "errors.recipientUnlock":
    "Die Empfängeridentität konnte nicht entsperrt werden. Prüfen Sie Passwort, Zertifikat und privaten Schlüssel.",
  "errors.recipientList": "Die Empfängerliste der PDF fehlt oder ist leer.",
  "errors.recipientEntry": "Die PDF enthält einen ungültigen Empfängereintrag.",
  "errors.recipientUnauthorized":
    "Diese Identität ist kein berechtigter Empfänger. Wählen Sie die dazugehörige .p12- oder .pfx-Datei.",
  "errors.recipientPem": "Das PEM-Empfängerzertifikat konnte nicht gelesen werden.",
  "errors.recipientCertificate":
    "Wählen Sie X.509-Empfängerzertifikate (.cer, .crt oder .pem) ohne private Schlüssel.",
  "errors.recipientKeyUnsupported":
    "Der Verschlüsselungsschlüssel dieses Empfängers wird nicht unterstützt.",
  "errors.recipientEncrypt": "Der Empfängerschlüssel konnte diese PDF nicht verschlüsseln.",
  "errors.recognitionFont":
    "Der erkannte Text enthält eine Schrift, die von der mitgelieferten PDF-Schriftart nicht unterstützt wird. Prüfen Sie die Erkennung vor dem Export.",
  "errors.projectSourceLink": "Dieses Projekt verweist auf einen nicht unterstützten Quelllink.",
  "errors.projectCommentMissing": "Dieses Projekt verweist auf einen fehlenden PDF-Kommentar.",
  "errors.projectReadOnlyComment":
    "Dieses Projekt verändert einen schreibgeschützten PDF-Kommentar.",
  "errors.projectCommentProperties":
    "Dieses Projekt verändert nicht unterstützte Eigenschaften eines Quellkommentars.",
  "errors.scanSource": "Die Scanbereinigung benötigt eine Quellseite.",
  "errors.selectedPageMissing": "Eine ausgewählte Seite existiert nicht mehr.",
  "errors.cropMargins": "Die Beschnittränder müssen sichtbaren Seiteninhalt übrig lassen.",
  "errors.deskewAnnotations":
    "Begradigen Sie Seiten, bevor Sie Kommentare oder Felder hinzufügen; deren Anmerkungsgeometrie kann nicht sicher gedreht werden.",
  "errors.cleanedImageMissing": "Das bereinigte Scanbild fehlt.",
  "errors.recipientX509Count":
    "Wählen Sie 1 bis 32 X.509-Empfängerzertifikate mit jeweils höchstens 2 MiB.",
  "errors.passwordConfirmations":
    "Die Bestätigungen für Öffnungs- und Eigentümerpasswort müssen übereinstimmen.",
  "errors.selectText": "Wählen Sie zuerst Text auf der PDF-Seite aus.",
  "errors.signaturePlaceholderMissing": "Der PDF-Signaturplatzhalter konnte nicht gefunden werden.",
  "errors.signaturePlaceholderInvalid": "Der PDF-Signaturplatzhalter ist ungültig.",
  "errors.signatureByteRange": "Die PDF ist für den Bytebereich ihrer Signatur zu groß.",
  "errors.signatureSpace": "Die Zertifikatskette überschreitet den Platz für die PDF-Signatur.",
  "errors.signatureRequirements":
    "Dieses Signaturfeld erfordert Startwerte oder Feldsperren, die PDFree nicht sicher erfüllen kann. Verwenden Sie eine Kopie ohne diese Anforderungen.",
  "errors.signatureUnsigned":
    "Verwenden Sie eine unsignierte PDF, wenn Sie eine PDFree-Signatur oder -Zertifizierung hinzufügen.",
  "errors.pdfCatalogMissing": "Der Verweis auf den PDF-Katalog fehlt.",
  "errors.signingAlgorithm":
    "Der Signaturalgorithmus dieses Zertifikats wird nicht unterstützt. Verwenden Sie RSA oder ECDSA.",
  "errors.signingCertificateRead": "Das Signaturzertifikat konnte nicht gelesen werden.",
  "errors.signingCertificateValidity":
    "Das Signaturzertifikat ist abgelaufen oder noch nicht gültig.",
  "errors.signingKeyUsageRead":
    "Die Schlüsselverwendung des Signaturzertifikats konnte nicht gelesen werden.",
  "errors.signingKeyUsage": "Dieses Zertifikat erlaubt keine digitalen Signaturen.",
  "errors.signingIdentityUnlock":
    "Die PKCS#12-Datei konnte nicht entsperrt werden. Prüfen Sie Passwort, Zertifikat und privaten Schlüssel.",
  "errors.signingKeyMismatch": "Das Zertifikat passt nicht zu seinem privaten Schlüssel.",
  "errors.textFont":
    "{{label}} enthält Zeichen, die diese Schrift nicht exportieren kann: {{characters}}. Wählen Sie eine unterstützte Schrift oder importieren Sie ein Unterschriftsbild.",
  "errors.textBox":
    "Der Text „{{label}}“ passt nicht in seinen Rahmen. Vergrößern Sie den Rahmen oder verkleinern Sie die Schrift vor dem Export.",
  "errors.encryptionHandler":
    "Diese PDF verwendet eine nicht unterstützte oder ungültige Verschlüsselungsroutine.",
  "errors.bookmarkIdentities": "Doppelte Lesezeichenkennungen.",
  "errors.pageRulesDuplicate": "Doppelte Seitenregeln.",
  "errors.pageRuleTarget": "Eine Seitenregel verweist auf eine fehlende Seite.",
  "errors.bookmarkTarget": "Ein Lesezeichen verweist auf eine fehlende Seite.",
  "errors.scanAssetMissing": "Das verarbeitete Scanbild fehlt.",
  "errors.deskewDestination":
    "Die Begradigung kann dieses positionierte Lesezeichen- oder Linkziel nicht erhalten. Verwenden Sie zuerst ein Ziel für die ganze Seite.",
  "errors.fieldWidgetRotation":
    "Dieses Formularsteuerelement verwendet eine nicht unterstützte Drehung.",
  "errors.pngPageLimit":
    "Diese Seite ist für den PNG-Export mit 108 dpi zu groß. Exportieren Sie sie als PDF, um die volle Auflösung zu erhalten.",
  "errors.editorProvider": "Der Editor-Anbieter fehlt.",
  "errors.draftProvider": "Der Anbieter für Dokumententwürfe fehlt.",
  "errors.bundledFont":
    "Eine mitgelieferte Schrift konnte nicht geladen werden. Laden Sie die Anwendung neu und versuchen Sie es erneut.",
  "errors.recognitionNotReady": "Die Texterkennung ist noch nicht bereit.",
  "errors.recognitionWorker": "Der Erkennungsprozess ist fehlgeschlagen.",
  "errors.recognitionImage": "Das Bild für die Erkennung konnte nicht vorbereitet werden.",
  "errors.batchSize":
    "Die Stapelausgabe überschreitet 128 MB. Verarbeiten Sie weniger Dateien gleichzeitig.",
  "errors.batchEmpty": "Keine erfolgreich erstellten Dateien zum Herunterladen vorhanden.",
  "errors.pageImage": "Der Export des Seitenbilds ist fehlgeschlagen.",
  "errors.savedDeleted": "Dieses gespeicherte Dokument wurde gelöscht.",
  "errors.savedChooseAnother":
    "Dieses gespeicherte Dokument wurde gelöscht. Wählen Sie ein anderes Dokument.",
  "errors.settingSave":
    "Dieser Browser konnte die Einstellung nicht speichern. Ihre bisherige Auswahl bleibt erhalten.",
  "errors.scanBlank": "Eingefügte Leerseiten enthalten keinen analysierbaren Scan.",
  "errors.offlineRegistration": "Die Registrierung ist fehlgeschlagen.",
  "errors.signatureType": "Geben Sie zuerst Ihre Unterschrift ein.",
  "errors.signatureCanvas": "Die Zeichenfläche für Unterschriften ist nicht verfügbar.",
  "errors.signatureChooseImage": "Wählen Sie zuerst ein Unterschriftsbild.",
  "errors.drawingUnavailable": "Zeichnen ist in diesem Browser nicht verfügbar.",
  "errors.signatureDraw": "Zeichnen Sie zuerst Ihre Unterschrift.",
  "errors.signatureImage": "Das Unterschriftsbild konnte nicht erstellt werden.",
  "errors.sourcePage": "Die Quellseite fehlt.",
  "errors.pdfRequest": "Unbekannte PDF-Anfrage.",
  "errors.utilityRequest": "Unbekannte Werkzeuganfrage.",
  "errors.autosaveDisabled":
    "Automatisches Speichern geschützter Dokumente ist in den Einstellungen deaktiviert.",
  "errors.pageDimensions":
    "Seitenabmessungen und Bildskalierung müssen positive, endliche Zahlen sein.",
  "errors.displayScale": "Die Anzeigeskalierung ist ungültig.",
  "errors.imageArchiveSize": "Die Größe des Bildarchivs ist ungültig.",
  "errors.imageArchiveLimit":
    "Dieses PNG-Archiv überschreitet 128 MB. Exportieren Sie weniger Seiten gleichzeitig.",
  "errors.imageRasterLimit":
    "Dieses Seitenbild überschreitet 32 Megapixel. Verringern Sie die Bildskalierung.",
  "errors.openProjectSingle": "Öffnen Sie jeweils nur ein Bearbeitungsprojekt.",
  "progress.preparing": "Vorbereitung…",
  "progress.image": "Bild {{index}} von {{count}}",
  "progress.page": "Seite {{index}} von {{count}}",
  "progress.file": "Datei {{index}} von {{count}} · {{name}}",
  "progress.analyzing": "Seite {{index}} von {{count}} wird analysiert",
  "progress.recognizing": "Seite {{index}} von {{count}} wird erkannt",
  "progress.ocrEngine": "Erkennungsmodul wird geladen",
  "progress.ocrInitialize": "Erkennungsmodul wird initialisiert",
  "progress.ocrLanguage": "Erkennungssprache wird geladen",
  "progress.ocrReady": "Erkennung wird vorbereitet",
  "progress.ocrText": "Text wird erkannt",
  "progress.ocrPhase": "{{phase}} · {{percent}} %",
  "errors.blankScanImage": "Eingefügte Leerseiten enthalten kein Scanbild.",
  "security.importCanceled":
    "Das Öffnen der PDF wurde abgebrochen. Ihr aktuelles Dokument ist unverändert.",
  "security.exportCanceled":
    "Signierung oder Schutz wurde abgebrochen. Es wurde keine gesicherte PDF heruntergeladen.",
  "security.importStopped":
    "Das Öffnen der PDF wurde beendet. Ihr aktuelles Dokument ist unverändert; versuchen Sie es erneut.",
  "security.exportStopped":
    "Signierung oder Schutz wurde beendet. Ihre Änderungen bleiben verfügbar; versuchen Sie es erneut.",
  "security.importReceive":
    "Die entsperrte PDF konnte nicht empfangen werden. Öffnen Sie sie erneut.",
  "security.exportReceive":
    "Die gesicherte PDF konnte nicht empfangen werden. Exportieren Sie sie erneut.",
  "security.importStart": "Der Prozess zum Öffnen der PDF konnte nicht gestartet werden.",
  "security.exportStart": "Der Signierungs- oder Schutzprozess konnte nicht gestartet werden.",
  "errors.workerStopped":
    "Der PDF-Prozess wurde beendet. Ihre aktuellen Änderungen bleiben verfügbar; versuchen Sie es erneut.",
  "errors.workerStart": "Der PDF-Prozess konnte nicht gestartet werden.",
  "password.openRequired": "Geben Sie das Öffnungs- oder Eigentümerpasswort dieser PDF ein.",
  "password.openIncorrect":
    "Dieses Passwort hat die PDF nicht entsperrt. Versuchen Sie das Öffnungs- oder Eigentümerpasswort.",
  "validation.encryptedSource":
    "Verschlüsselte Quellen benötigen Arbeitsdaten und Verschlüsselungsmetadaten.",
  "validation.projectEncryptionVersion":
    "Verschlüsselte Quellen benötigen Projektversion 2 oder neuer.",
  "validation.projectComments": "Projekte der Version 3 benötigen Kommentareinträge.",
  "validation.projectUtilities": "Projekte der Version 4 benötigen ausdrückliche Werkzeugeinträge.",
  "validation.nameRequired": "Geben Sie dem Dokument einen Namen.",
  "validation.fieldNameRequired": "Geben Sie jedem neuen Formularfeld einen Namen.",
  "validation.optionLimit": "Verwenden Sie höchstens {{count}} Optionen.",
  "validation.optionRequired": "Geben Sie jeder Option einen Wert.",
  "validation.optionUnique": "Jede Option muss eindeutig sein.",
  "validation.fieldRotation": "Formularfelder unterstützen Vierteldrehungen (Vielfache von 90°).",
  "validation.radioRotation":
    "Radiogruppen unterstützen eine Objektdrehung von 0°. Drehen Sie stattdessen die Seite.",
  "validation.number": "{{label}} muss eine Zahl sein.",
  "validation.range": "{{label}} muss zwischen {{minimum}} und {{maximum}} liegen.",
  "validation.nameLength": "Dokumentnamen dürfen höchstens {{count}} Zeichen enthalten.",
  "validation.fieldDuplicate":
    "Der Feldname {{name}} ist bereits vorhanden. Wählen Sie einen eindeutigen Namen.",
  "validation.fieldOptions": "Fügen Sie Optionen für {{name}} hinzu, eine pro Zeile.",
  "validation.fieldChoice": "Der Wert von {{name}} entspricht keiner seiner Optionen.",
  "validation.radioOptions": "Fügen Sie Radiooptionen für {{name}} hinzu, eine pro Zeile.",
  "validation.radioEnlarge":
    "Vergrößern Sie die Radiogruppe {{name}}, damit ihre Optionen hineinpassen.",
  "validation.singleChoice": "Das Feld {{name}} erlaubt nur eine ausgewählte Option.",
  "validation.checkedValue": "Der Wert von {{name}} muss aktiviert oder deaktiviert sein.",
  "validation.textValue": "Der Wert von {{name}} muss Text sein.",
  "validation.choiceValue": "Der Wert von {{name}} muss eine Auswahl sein.",
  "validation.radioUnsupported":
    "Radiogruppen erfordern derzeit eine Objektdrehung von null. Seitendrehung wird unterstützt.",
  "errors.destinationCoordinates": "Nicht unterstützte Zielkoordinaten.",
  "errors.bookmarkStyle":
    "Formatierte oder mit der Struktur verknüpfte Lesezeichen erfordern die Erhaltung des Originalkatalogs.",
  "errors.bookmarkAction": "Nicht unterstützte Lesezeichenaktion.",
  "errors.destinationTree": "Nicht unterstützter Zielbaum.",
  "errors.emptyOutline": "Nicht unterstützter leerer Gliederungskatalog.",
  "errors.bookmarkDestination": "Nicht unterstütztes Lesezeichen- oder Linkziel.",
  "errors.bookmarkDepth": "Die Lesezeichenhierarchie ist zu tief.",
  "errors.bookmarkHierarchy": "Die Lesezeichenhierarchie ist ungültig.",
  "errors.sourceLinkMissing": "Die Quell-Linkanmerkung fehlt.",
  "errors.commentRequired": "Schreiben Sie zuerst einen Kommentar.",
  "errors.commentLength": "Dieser Kommentar ist zu lang.",
  "errors.commentPageMissing": "Die Seite dieses Kommentars existiert nicht mehr.",
  "errors.commentLimit": "Verwenden Sie höchstens 10.000 Kommentare pro Seite.",
  "errors.commentThreadMissing": "Der Kommentarverlauf existiert nicht mehr.",
  "errors.commentTextLimit": "Schreiben Sie einen Kommentar mit höchstens 100.000 Zeichen.",
  "errors.commentReadOnlyThread": "Dieser Verlauf enthält einen schreibgeschützten Kommentar.",
  "errors.commentCircular": "Dieses Dokument enthält einen zyklischen Kommentarverlauf.",
  "errors.commentMissingThread": "Dieses Dokument verweist auf einen fehlenden Kommentarverlauf.",
  "errors.compressionTarget": "Wählen Sie eine gültige Zielgröße.",
  "errors.annotationComposition":
    "Die Seitenzusammenstellung kann Beziehungen zwischen Anmerkungen auf verschiedenen Seiten nicht erhalten. Exportieren Sie stattdessen das vollständige Originaldokument.",
  "errors.imageMissing": "In diesem Projekt fehlt ein Bild.",
  "errors.splitOutputRequired": "Wählen Sie mindestens eine aufgeteilte Ausgabedatei.",
  "errors.splitPagesRequired":
    "Jede aufgeteilte Ausgabedatei muss mindestens eine Seite enthalten.",
  "errors.splitPageDuplicate": "Wählen Sie jede Seite nur einmal pro Ausgabedatei.",
  "errors.splitPageOutside": "Eine aufzuteilende Seite liegt außerhalb des Dokuments.",
  "errors.commentAnnotationMissing": "Dieser Kommentar verweist auf eine fehlende PDF-Anmerkung.",
  "errors.commentReadOnly": "Dieser PDF-Kommentar ist schreibgeschützt.",
  "errors.commentMarkup": "Dieser Markierungskommentar kann nicht bearbeitet werden.",
  "errors.commentReplyMissing": "Dieser Kommentar verweist auf einen fehlenden Antwortverlauf.",
  "errors.exportPageMissing": "Eine Exportseite existiert nicht mehr.",
  "errors.exportPageDuplicate": "Wählen Sie jede Exportseite nur einmal.",
  "errors.exportPagesRequired": "Wählen Sie mindestens eine Seite zum Exportieren.",
  "errors.commentGeometry":
    "Dieser PDF-Kommentar überschreitet die unterstützten Text- oder Koordinatengrenzen.",
  "errors.commentPageLimit": "Diese PDF enthält mehr als 10.000 Kommentare auf einer Seite.",
  "errors.xfa":
    "Dieses Dokument verwendet XFA-Formulare, die PDFree nicht sicher bearbeiten kann. Öffnen Sie es in einem XFA-fähigen Editor.",
  "errors.signedInput":
    "Diese PDF enthält Zertifikatssignaturfelder. Eine Bearbeitung könnte Signaturen ungültig machen; verwenden Sie eine unsignierte Kopie.",
  "errors.formControls":
    "Diese PDF enthält nicht unterstützte Formularsteuerelemente. Verwenden Sie eine Kopie ohne diese Elemente.",
  "errors.widgetRotation":
    "Diese PDF enthält ein Formularsteuerelement mit nicht unterstützter Drehung. Verwenden Sie Vierteldrehungen.",
  "errors.pdfUnreadable":
    "Diese Datei konnte nicht als PDF gelesen werden. Sie ist möglicherweise beschädigt oder wird nicht unterstützt.",
  "errors.pageUnits":
    "Diese PDF verwendet nicht standardisierte Seiteneinheiten. Konvertieren Sie sie vor der Bearbeitung in Standard-PDF-Seiteneinheiten.",
  "errors.annotationAppearance":
    "Die Anmerkung {{type}} hat keine unterstützte Darstellung. Mehrere Seiten pro Blatt können sie nicht sicher einbetten.",
  "errors.annotationTransform":
    "Mehrere Seiten pro Blatt können Anmerkungen mit festem Zoom oder fester Drehung nicht erhalten.",
  "errors.appearanceGeometry": "Die Darstellungsgeometrie der Anmerkung ist ungültig.",
  "errors.appearanceEmpty": "Die Darstellung der Anmerkung ist leer.",
  "errors.printFlatten": "Reduzieren Sie Formularfelder, bevor Sie ein Drucklayout vorbereiten.",
  "errors.printMargins": "Die Ränder lassen keinen druckbaren Bereich übrig.",
  "errors.keepPage": "Behalten Sie mindestens eine Seite oder öffnen Sie ein neues Dokument.",
  "errors.pageRangeDuplicate": "Eine Seite kommt in diesem Ausgabebereich mehrfach vor.",
  "errors.pagesRequired": "Wählen Sie mindestens eine Seite.",
  "errors.rangeInvalid": "Ungültiger Seitenbereich: {{range}}. Verwenden Sie 1-3, 5 oder 7-end.",
  "errors.rangeBounds": "Der Seitenbereich {{range}} muss zwischen 1 und {{count}} liegen.",
  "errors.rangeInteger": "Geben Sie eine ganze Zahl von 1 bis {{count}} ein.",
  "errors.openFirst": "Öffnen Sie zuerst eine PDF.",
  "errors.ruleHeight":
    "Der Text der Seitenregel ist für diese Seite zu hoch. Verwenden Sie eine kleinere Schrift.",
  "errors.ruleFont":
    "Der Text der Seitenregel enthält Zeichen, die von der PDF-Schrift nicht unterstützt werden.",
  "errors.ruleWidth":
    "Der Text der Seitenregel ist für diese Seite zu breit. Verwenden Sie eine kleinere Schrift oder einen kürzeren Text.",
  "errors.scopeRange": "Geben Sie Seiten wie 1-3, 5 ein.",
  "errors.imageDepth": "Die Verschachtelung der Bildressourcen ist zu tief.",
  "errors.imageEncoding":
    "Diese Bildkodierung, dieser Farbraum oder diese Maske kann nicht sicher verarbeitet werden.",
  "errors.imageUnavailable": "Bildverarbeitung ist in diesem Browser nicht verfügbar.",
  "errors.scanDataLength": "Unerwartete Länge der Scanbilddaten.",
  "errors.scanSingleImage":
    "Die Scanbereinigung benötigt ein einzelnes direktes Scanbild pro Seite; gemischte Layouts werden nicht unterstützt.",
  "errors.scanColor": "Diese Seite enthält kein unterstütztes RGB- oder Graustufen-Scanbild.",
  "errors.scanStream": "Nicht unterstützter Scan-Inhaltsstrom.",
  "errors.scanBudget": "Der Scaninhalt überschreitet das Verarbeitungslimit.",
  "errors.scanMixedLayout":
    "Die Scanbereinigung kann dieses gemischte Seitenlayout nicht erhalten.",
  "errors.scanImageUpright": "Die Scanbereinigung erfordert ein aufrecht platziertes Bild.",
  "errors.scanTransformUpright":
    "Die Scanbereinigung erfordert aufrechte Bild- und Seitentransformationen.",
} as const;
