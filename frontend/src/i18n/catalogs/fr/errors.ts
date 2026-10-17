export const errors = {
  "errors.recipientCount":
    "Choisissez de 1 à 32 certificats de destinataire, de 2 Mio maximum chacun.",
  "errors.ownerPasswordRequired":
    "Saisissez un mot de passe de propriétaire pour contrôler les permissions du PDF.",
  "errors.passwordsDifferent":
    "Utilisez des mots de passe d’ouverture et de propriétaire différents ; celui de propriétaire contourne les restrictions.",
  "errors.passwordByteLimit": "Les mots de passe PDF ne doivent pas dépasser 127 octets UTF-8.",
  "errors.passwordNull": "Les mots de passe PDF ne peuvent pas contenir de caractère nul.",
  "errors.permissions": "Choisissez des permissions PDF valides.",
  "errors.certificateFile": "Choisissez un certificat PKCS#12 (.p12/.pfx) de 2 Mio maximum.",
  "errors.certificationPolicy": "Choisissez une politique de certification PDF valide.",
  "errors.signingMetadataLength":
    "Le motif et le lieu de signature ne doivent pas dépasser 1024 caractères.",
  "errors.certificatePasswordLength":
    "Les mots de passe de certificat ne doivent pas dépasser 1024 caractères.",
  "errors.projectArchiveSize": "Les tailles d’archive de ce projet sont invalides.",
  "errors.projectArchiveLimit":
    "Ce projet dépasse la limite d’archive de 256 Mo. Enregistrez moins de PDF sources.",
  "errors.projectExpandedLimit": "Ce projet dépasse la taille prise en charge après décompression.",
  "errors.projectManifestLimit": "Le manifeste de ce projet est trop grand.",
  "errors.projectEncryptedBytes":
    "Les sources chiffrées nécessitent leurs octets originaux et leurs octets de travail déchiffrés.",
  "errors.projectObjectIdentities": "Ce projet contient des identifiants d’objet en double.",
  "errors.projectFieldMissing": "Ce projet fait référence à un champ de formulaire absent.",
  "errors.projectPageMissing": "Ce projet fait référence à une page PDF absente.",
  "errors.projectImageMissing": "Ce projet fait référence à une image absente.",
  "errors.projectAnnotationsDuplicate": "Ce projet contient des références d’annotation en double.",
  "errors.projectFileMissing": "Il manque {{path}} dans ce projet.",
  "errors.projectVersion":
    "Ce projet n’est pas un projet PDFree pris en charge de version 1, 2, 3 ou 4.",
  "errors.projectJson": "Le manifeste de ce projet n’est pas un JSON valide.",
  "errors.projectSave": "Impossible d’enregistrer ce projet d’édition : {{path}} — {{details}}",
  "errors.projectInvalidValue": "Valeur de projet invalide.",
  "errors.encryptionKeyLength": "Longueur de clé de chiffrement à clé publique invalide.",
  "errors.encryptionVersion": "Version de chiffrement à clé publique non prise en charge.",
  "errors.encryptionSubfilter": "Sous-filtre PDF à clé publique non pris en charge.",
  "errors.cryptMethod": "Méthode de filtre cryptographique à clé publique non prise en charge.",
  "errors.cryptKeyLength": "Longueur de clé du filtre cryptographique à clé publique invalide.",
  "errors.cryptFilter": "Filtre cryptographique à clé publique invalide.",
  "errors.recipientIdentityRequired":
    "Sélectionnez une identité de destinataire .p12 ou .pfx et saisissez son mot de passe.",
  "errors.cryptFilterMissing": "Le PDF fait référence à un filtre cryptographique absent.",
  "errors.recipientContentMissing": "Le PDF ne contient aucun contenu chiffré de destinataire.",
  "errors.oaepParameters": "Paramètres RSA-OAEP non pris en charge",
  "errors.rc2KeyLength": "Longueur effective de clé RC2 non prise en charge",
  "errors.rc2Iv": "Le vecteur d’initialisation RC2 est absent",
  "errors.recipientEncryption": "Chiffrement du contenu de destinataire non pris en charge",
  "errors.envelopeContent": "Le contenu chiffré de l’enveloppe est absent",
  "errors.envelopePadding": "Remplissage de l’enveloppe de destinataire invalide",
  "errors.rsaPrivateKey": "Une clé privée RSA est requise",
  "errors.recipientTransport": "Transport de clé de destinataire non pris en charge",
  "errors.envelopeType": "L’entrée de destinataire n’est pas un CMS EnvelopedData",
  "errors.recipientSeed": "Taille de graine de destinataire invalide",
  "errors.recipientDecrypt":
    "Cette identité n’a pas pu déchiffrer une entrée de destinataire. Sélectionnez l’identité de destinataire correspondante.",
  "errors.certificateMissing": "Le certificat est absent",
  "errors.certificateKeyMissing": "Le certificat ou la clé privée est absent",
  "errors.recipientUnlock":
    "L’identité de destinataire n’a pas pu être déverrouillée. Vérifiez son mot de passe, son certificat et sa clé privée.",
  "errors.recipientList": "La liste des destinataires du PDF est absente ou vide.",
  "errors.recipientEntry": "Le PDF contient une entrée de destinataire invalide.",
  "errors.recipientUnauthorized":
    "Cette identité n’est pas un destinataire autorisé. Sélectionnez son fichier .p12 ou .pfx correspondant.",
  "errors.recipientPem": "Le certificat PEM du destinataire n’a pas pu être lu.",
  "errors.recipientCertificate":
    "Choisissez des certificats X.509 de destinataire (.cer, .crt ou .pem), sans clés privées.",
  "errors.recipientKeyUnsupported":
    "La clé de chiffrement de ce destinataire n’est pas prise en charge.",
  "errors.recipientEncrypt": "La clé du destinataire n’a pas pu chiffrer ce PDF.",
  "errors.recognitionFont":
    "Le texte reconnu contient une écriture non prise en charge par la police PDF fournie. Vérifiez la reconnaissance avant d’exporter.",
  "errors.projectSourceLink": "Ce projet fait référence à un lien source non pris en charge.",
  "errors.projectCommentMissing": "Ce projet fait référence à un commentaire PDF absent.",
  "errors.projectReadOnlyComment": "Ce projet modifie un commentaire PDF en lecture seule.",
  "errors.projectCommentProperties":
    "Ce projet modifie des propriétés de commentaire source non prises en charge.",
  "errors.scanSource": "Le nettoyage nécessite une page source.",
  "errors.selectedPageMissing": "Une page sélectionnée n’existe plus.",
  "errors.cropMargins": "Les marges de recadrage doivent laisser du contenu visible sur la page.",
  "errors.deskewAnnotations":
    "Redressez les pages avant d’ajouter des commentaires ou des champs ; la géométrie de leurs annotations ne peut pas être tournée en toute sécurité.",
  "errors.cleanedImageMissing": "L’image de numérisation nettoyée est absente.",
  "errors.recipientX509Count":
    "Choisissez de 1 à 32 certificats X.509 de destinataire, de 2 Mio maximum chacun.",
  "errors.passwordConfirmations":
    "Les confirmations des mots de passe d’ouverture et de propriétaire doivent correspondre.",
  "errors.selectText": "Sélectionnez d’abord du texte sur la page PDF.",
  "errors.signaturePlaceholderMissing":
    "L’emplacement réservé à la signature PDF n’a pas pu être trouvé.",
  "errors.signaturePlaceholderInvalid": "L’emplacement réservé à la signature PDF est invalide.",
  "errors.signatureByteRange": "Le PDF est trop grand pour la plage d’octets de sa signature.",
  "errors.signatureSpace": "La chaîne de certificats dépasse l’espace réservé à la signature PDF.",
  "errors.signatureRequirements":
    "Ce champ de signature impose des valeurs initiales ou des verrouillages de champs que PDFree ne peut pas respecter en toute sécurité. Utilisez une copie sans ces exigences.",
  "errors.signatureUnsigned":
    "Utilisez un PDF non signé pour ajouter une signature ou une certification PDFree.",
  "errors.pdfCatalogMissing": "La référence au catalogue PDF est absente.",
  "errors.signingAlgorithm":
    "L’algorithme de signature de ce certificat n’est pas pris en charge. Utilisez RSA ou ECDSA.",
  "errors.signingCertificateRead": "Le certificat de signature n’a pas pu être lu.",
  "errors.signingCertificateValidity":
    "Le certificat de signature a expiré ou n’est pas encore valide.",
  "errors.signingKeyUsageRead": "L’usage de clé du certificat de signature n’a pas pu être lu.",
  "errors.signingKeyUsage": "Ce certificat n’autorise pas les signatures numériques.",
  "errors.signingIdentityUnlock":
    "Le fichier PKCS#12 n’a pas pu être déverrouillé. Vérifiez son mot de passe, son certificat et sa clé privée.",
  "errors.signingKeyMismatch": "Le certificat ne correspond pas à sa clé privée.",
  "errors.textFont":
    "{{label}} contient des caractères que cette police ne peut pas exporter : {{characters}}. Choisissez une police prise en charge ou importez une image de signature.",
  "errors.textBox":
    "Le texte « {{label}} » ne tient pas dans son cadre. Agrandissez le cadre ou réduisez la taille de police avant d’exporter.",
  "errors.encryptionHandler":
    "Ce PDF utilise un gestionnaire de chiffrement non pris en charge ou invalide.",
  "errors.bookmarkIdentities": "Identifiants de signet en double.",
  "errors.pageRulesDuplicate": "Règles de page en double.",
  "errors.pageRuleTarget": "Une règle de page cible une page absente.",
  "errors.bookmarkTarget": "Un signet cible une page absente.",
  "errors.scanAssetMissing": "L’image de numérisation traitée est absente.",
  "errors.deskewDestination":
    "Le redressement ne peut pas conserver cette destination de signet ou de lien positionnée. Utilisez d’abord une destination de page entière.",
  "errors.fieldWidgetRotation":
    "Ce contrôle de formulaire utilise une rotation non prise en charge.",
  "errors.pngPageLimit":
    "Cette page est trop grande pour une exportation PNG à 108 ppp. Exportez-la en PDF pour conserver sa résolution complète.",
  "errors.editorProvider": "Le fournisseur de l’éditeur est absent.",
  "errors.draftProvider": "Le fournisseur de brouillons du document est absent.",
  "errors.bundledFont":
    "Une police fournie n’a pas pu être chargée. Rechargez l’application et réessayez.",
  "errors.recognitionNotReady": "Le moteur de reconnaissance n’est pas encore prêt.",
  "errors.recognitionWorker": "Le processus de reconnaissance a échoué.",
  "errors.recognitionImage": "L’image à reconnaître n’a pas pu être préparée.",
  "errors.batchSize": "Le résultat du lot dépasse 128 Mo. Traitez moins de fichiers à la fois.",
  "errors.batchEmpty": "Aucun résultat réussi à télécharger.",
  "errors.pageImage": "L’exportation de l’image de la page a échoué.",
  "errors.savedDeleted": "Ce document enregistré a été supprimé.",
  "errors.savedChooseAnother": "Ce document enregistré a été supprimé. Choisissez-en un autre.",
  "errors.settingSave":
    "Ce navigateur n’a pas pu enregistrer le réglage. Votre choix précédent est conservé.",
  "errors.scanBlank": "Les pages vierges insérées ne contiennent aucune numérisation à analyser.",
  "errors.offlineRegistration": "L’enregistrement a échoué.",
  "errors.signatureType": "Saisissez d’abord votre signature.",
  "errors.signatureCanvas": "La zone de dessin de signature est indisponible.",
  "errors.signatureChooseImage": "Choisissez d’abord une image de signature.",
  "errors.drawingUnavailable": "Le dessin est indisponible dans ce navigateur.",
  "errors.signatureDraw": "Dessinez d’abord votre signature.",
  "errors.signatureImage": "L’image de signature n’a pas pu être créée.",
  "errors.sourcePage": "La page source est absente.",
  "errors.pdfRequest": "Requête PDF inconnue.",
  "errors.utilityRequest": "Requête d’outil inconnue.",
  "errors.autosaveDisabled":
    "L’enregistrement automatique des documents protégés est désactivé dans les réglages.",
  "errors.pageDimensions":
    "Les dimensions de la page et l’échelle de l’image doivent être des nombres positifs et finis.",
  "errors.displayScale": "L’échelle d’affichage est invalide.",
  "errors.imageArchiveSize": "La taille de l’archive d’images est invalide.",
  "errors.imageArchiveLimit":
    "Cette archive PNG dépasse 128 Mo. Exportez moins de pages à la fois.",
  "errors.imageRasterLimit":
    "L’image de cette page dépasse 32 mégapixels. Réduisez l’échelle de l’image.",
  "errors.openProjectSingle": "Ouvrez un seul projet d’édition à la fois.",
  "progress.preparing": "Préparation…",
  "progress.image": "Image {{index}} sur {{count}}",
  "progress.page": "Page {{index}} sur {{count}}",
  "progress.file": "Fichier {{index}} sur {{count}} · {{name}}",
  "progress.analyzing": "Analyse de la page {{index}} sur {{count}}",
  "progress.recognizing": "Reconnaissance de la page {{index}} sur {{count}}",
  "progress.ocrEngine": "Chargement du moteur de reconnaissance",
  "progress.ocrInitialize": "Initialisation du moteur de reconnaissance",
  "progress.ocrLanguage": "Chargement de la langue de reconnaissance",
  "progress.ocrReady": "Préparation de la reconnaissance",
  "progress.ocrText": "Reconnaissance du texte",
  "progress.ocrPhase": "{{phase}} · {{percent}} %",
  "errors.blankScanImage": "Les pages vierges insérées ne contiennent aucune image numérisée.",
  "security.importCanceled":
    "L’ouverture du PDF a été annulée. Votre document actuel est inchangé.",
  "security.exportCanceled":
    "La signature ou la protection a été annulée. Aucun PDF sécurisé n’a été téléchargé.",
  "security.importStopped":
    "L’ouverture du PDF s’est arrêtée. Votre document actuel est inchangé ; réessayez.",
  "security.exportStopped":
    "La signature ou la protection s’est arrêtée. Vos modifications restent disponibles ; réessayez.",
  "security.importReceive":
    "Le PDF déverrouillé n’a pas pu être reçu. Essayez de l’ouvrir à nouveau.",
  "security.exportReceive":
    "Le PDF sécurisé n’a pas pu être reçu. Essayez de l’exporter à nouveau.",
  "security.importStart": "Le processus d’ouverture du PDF n’a pas pu démarrer.",
  "security.exportStart": "Le processus de signature ou de protection n’a pas pu démarrer.",
  "errors.workerStopped":
    "Le processus PDF s’est arrêté. Vos modifications actuelles restent disponibles ; réessayez.",
  "errors.workerStart": "Le processus PDF n’a pas pu démarrer.",
  "password.openRequired": "Saisissez le mot de passe d’ouverture ou de propriétaire de ce PDF.",
  "password.openIncorrect":
    "Ce mot de passe n’a pas déverrouillé le PDF. Essayez son mot de passe d’ouverture ou de propriétaire.",
  "validation.encryptedSource":
    "Les sources chiffrées nécessitent des octets de travail et des métadonnées de chiffrement.",
  "validation.projectEncryptionVersion":
    "Les sources chiffrées nécessitent un projet de version 2 ou ultérieure.",
  "validation.projectComments":
    "Les projets de version 3 nécessitent des enregistrements de commentaires.",
  "validation.projectUtilities":
    "Les projets de version 4 nécessitent des enregistrements explicites des outils.",
  "validation.nameRequired": "Donnez un nom au document.",
  "validation.fieldNameRequired": "Donnez un nom à chaque nouveau champ de formulaire.",
  "validation.optionLimit": "Utilisez au maximum {{count}} options.",
  "validation.optionRequired": "Donnez une valeur à chaque option.",
  "validation.optionUnique": "Chaque option doit être unique.",
  "validation.fieldRotation":
    "Les champs de formulaire acceptent les rotations par quart de tour (multiples de 90°).",
  "validation.radioRotation":
    "Les groupes de boutons radio acceptent une rotation d’objet de 0°. Faites plutôt pivoter la page.",
  "validation.number": "{{label}} doit être un nombre.",
  "validation.range": "{{label}} doit être compris entre {{minimum}} et {{maximum}}.",
  "validation.nameLength": "Le nom d’un document peut contenir au maximum {{count}} caractères.",
  "validation.fieldDuplicate": "Le nom de champ {{name}} existe déjà. Choisissez un nom unique.",
  "validation.fieldOptions": "Ajoutez des options à {{name}}, une par ligne.",
  "validation.fieldChoice": "La valeur de {{name}} ne correspond à aucune de ses options.",
  "validation.radioOptions": "Ajoutez des options radio à {{name}}, une par ligne.",
  "validation.radioEnlarge":
    "Agrandissez le groupe de boutons radio {{name}} pour y faire tenir ses options.",
  "validation.singleChoice": "Le champ {{name}} n’accepte qu’une seule option sélectionnée.",
  "validation.checkedValue": "La valeur de {{name}} doit être cochée ou décochée.",
  "validation.textValue": "La valeur de {{name}} doit être du texte.",
  "validation.choiceValue": "La valeur de {{name}} doit être un choix.",
  "validation.radioUnsupported":
    "Les groupes de boutons radio nécessitent actuellement une rotation d’objet nulle. La rotation de page est prise en charge.",
  "errors.destinationCoordinates": "Coordonnées de destination non prises en charge.",
  "errors.bookmarkStyle":
    "Les signets stylisés ou liés à la structure nécessitent de conserver le catalogue d’origine.",
  "errors.bookmarkAction": "Action de signet non prise en charge.",
  "errors.destinationTree": "Arbre de destinations non pris en charge.",
  "errors.emptyOutline": "Catalogue de plan vide non pris en charge.",
  "errors.bookmarkDestination": "Destination de signet ou de lien non prise en charge.",
  "errors.bookmarkDepth": "La hiérarchie des signets est trop profonde.",
  "errors.bookmarkHierarchy": "La hiérarchie des signets est invalide.",
  "errors.sourceLinkMissing": "L’annotation de lien source est absente.",
  "errors.commentRequired": "Rédigez d’abord un commentaire.",
  "errors.commentLength": "Ce commentaire est trop long.",
  "errors.commentPageMissing": "La page de ce commentaire n’existe plus.",
  "errors.commentLimit": "Utilisez au maximum 10 000 commentaires par page.",
  "errors.commentThreadMissing": "Le fil de ce commentaire n’existe plus.",
  "errors.commentTextLimit": "Rédigez un commentaire de 100 000 caractères au maximum.",
  "errors.commentReadOnlyThread": "Ce fil contient un commentaire en lecture seule.",
  "errors.commentCircular": "Ce document contient un fil de commentaires circulaire.",
  "errors.commentMissingThread": "Ce document fait référence à un fil de commentaires absent.",
  "errors.compressionTarget": "Choisissez une taille cible valide.",
  "errors.annotationComposition":
    "La composition de pages ne peut pas conserver les relations entre annotations de pages différentes. Exportez plutôt le document original complet.",
  "errors.imageMissing": "Une image est absente de ce projet.",
  "errors.splitOutputRequired": "Choisissez au moins un fichier de sortie pour la division.",
  "errors.splitPagesRequired":
    "Chaque fichier issu de la division doit contenir au moins une page.",
  "errors.splitPageDuplicate": "Choisissez chaque page une seule fois par fichier de sortie.",
  "errors.splitPageOutside": "Une page à diviser se situe hors du document.",
  "errors.commentAnnotationMissing": "Ce commentaire fait référence à une annotation PDF absente.",
  "errors.commentReadOnly": "Ce commentaire PDF est en lecture seule.",
  "errors.commentMarkup": "Ce commentaire de balisage ne peut pas être modifié.",
  "errors.commentReplyMissing": "Ce commentaire fait référence à un fil de réponses absent.",
  "errors.exportPageMissing": "Une page à exporter n’existe plus.",
  "errors.exportPageDuplicate": "Choisissez chaque page à exporter une seule fois.",
  "errors.exportPagesRequired": "Choisissez au moins une page à exporter.",
  "errors.commentGeometry":
    "Ce commentaire PDF dépasse les limites de texte ou de coordonnées prises en charge.",
  "errors.commentPageLimit": "Ce PDF contient plus de 10 000 commentaires sur une page.",
  "errors.xfa":
    "Ce document utilise des formulaires XFA que PDFree ne peut pas modifier en toute sécurité. Ouvrez-le dans un éditeur compatible XFA.",
  "errors.signedInput":
    "Ce PDF contient des champs de signature par certificat. Une modification pourrait invalider les signatures ; utilisez une copie non signée.",
  "errors.formControls":
    "Ce PDF contient des contrôles de formulaire non pris en charge. Utilisez une copie sans ces contrôles.",
  "errors.widgetRotation":
    "Ce PDF contient un contrôle de formulaire dont la rotation n’est pas prise en charge. Utilisez des rotations par quart de tour.",
  "errors.pdfUnreadable":
    "Ce fichier n’a pas pu être lu comme PDF. Il est peut-être endommagé ou non pris en charge.",
  "errors.pageUnits":
    "Ce PDF utilise des unités de page non standard. Convertissez-les en unités de page PDF standard avant de le modifier.",
  "errors.annotationAppearance":
    "L’annotation {{type}} n’a pas d’apparence prise en charge. La disposition de plusieurs pages par feuille ne peut pas l’intégrer en toute sécurité.",
  "errors.annotationTransform":
    "La disposition de plusieurs pages par feuille ne peut pas conserver les annotations dont le zoom ou la rotation sont fixes.",
  "errors.appearanceGeometry": "La géométrie de l’apparence de l’annotation est invalide.",
  "errors.appearanceEmpty": "L’apparence de l’annotation est vide.",
  "errors.printFlatten": "Aplatissez les champs avant de préparer une mise en page d’impression.",
  "errors.printMargins": "Les marges ne laissent aucune zone imprimable.",
  "errors.keepPage": "Conservez au moins une page ou ouvrez un nouveau document.",
  "errors.pageRangeDuplicate": "Une page apparaît plusieurs fois dans cette plage de sortie.",
  "errors.pagesRequired": "Choisissez au moins une page.",
  "errors.rangeInvalid": "Plage de pages invalide : {{range}}. Utilisez 1-3, 5 ou 7-end.",
  "errors.rangeBounds": "La plage de pages {{range}} doit être comprise entre 1 et {{count}}.",
  "errors.rangeInteger": "Saisissez un nombre entier de 1 à {{count}}.",
  "errors.openFirst": "Ouvrez d’abord un PDF.",
  "errors.ruleHeight":
    "Le texte de la règle de page est trop haut pour cette page. Utilisez une police plus petite.",
  "errors.ruleFont":
    "Le texte de la règle de page contient des caractères non pris en charge par la police PDF.",
  "errors.ruleWidth":
    "Le texte de la règle de page est trop large pour cette page. Utilisez une police plus petite ou un libellé plus court.",
  "errors.scopeRange": "Saisissez des pages telles que 1-3, 5.",
  "errors.imageDepth": "L’imbrication des ressources d’image est trop profonde.",
  "errors.imageEncoding":
    "Cet encodage, espace colorimétrique ou masque d’image ne peut pas être traité en toute sécurité.",
  "errors.imageUnavailable": "Le traitement d’images est indisponible dans ce navigateur.",
  "errors.scanDataLength": "La longueur des données de l’image numérisée est inattendue.",
  "errors.scanSingleImage":
    "Le nettoyage nécessite une seule image numérisée directe par page ; les dispositions mixtes ne sont pas prises en charge.",
  "errors.scanColor":
    "Cette page ne contient pas d’image numérisée RVB ou en niveaux de gris prise en charge.",
  "errors.scanStream": "Flux de contenu numérisé non pris en charge.",
  "errors.scanBudget": "Le contenu numérisé dépasse le budget de traitement.",
  "errors.scanMixedLayout": "Le nettoyage ne peut pas conserver cette disposition de page mixte.",
  "errors.scanImageUpright": "Le nettoyage nécessite une image placée sans rotation.",
  "errors.scanTransformUpright":
    "Le nettoyage nécessite des transformations d’image et de page sans rotation.",
} as const;
