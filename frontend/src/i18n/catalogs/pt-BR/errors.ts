export const errors = {
  "errors.pngPageLimit":
    "Esta página é grande demais para exportar como PNG a 108 dpi. Exporte como PDF para manter a resolução completa.",
  "errors.editorProvider": "O provedor do editor está ausente.",
  "errors.draftProvider": "O provedor de rascunhos do documento está ausente.",
  "errors.bundledFont":
    "Não foi possível carregar uma fonte incluída. Recarregue o aplicativo e tente novamente.",
  "errors.recognitionNotReady": "O mecanismo de reconhecimento ainda não está pronto.",
  "errors.recognitionWorker": "O processo de reconhecimento falhou.",
  "errors.recognitionImage": "Não foi possível preparar a imagem para reconhecimento.",
  "errors.batchSize": "A saída do lote ultrapassa 128 MB. Processe menos arquivos por vez.",
  "errors.batchEmpty": "Não há resultados bem-sucedidos para baixar.",
  "errors.pageImage": "A exportação da imagem da página falhou.",
  "errors.savedDeleted": "Este documento salvo foi excluído.",
  "errors.savedChooseAnother": "Este documento salvo foi excluído. Escolha outro documento.",
  "errors.settingSave":
    "Este navegador não conseguiu salvar a configuração. Sua escolha anterior foi mantida.",
  "errors.scanBlank": "As páginas em branco inseridas não têm digitalização para analisar.",
  "errors.offlineRegistration": "O registro falhou.",
  "errors.signatureType": "Primeiro digite sua assinatura.",
  "errors.signatureCanvas": "A área de desenho da assinatura está indisponível.",
  "errors.signatureChooseImage": "Primeiro escolha uma imagem de assinatura.",
  "errors.drawingUnavailable": "O desenho está indisponível neste navegador.",
  "errors.signatureDraw": "Primeiro desenhe sua assinatura.",
  "errors.signatureImage": "Não foi possível criar a imagem da assinatura.",
  "errors.sourcePage": "A página de origem está ausente.",
  "errors.pdfRequest": "Solicitação de PDF desconhecida.",
  "errors.utilityRequest": "Solicitação de ferramenta desconhecida.",
  "errors.autosaveDisabled":
    "O salvamento automático de documentos protegidos está desativado nas Configurações.",
  "errors.pageDimensions":
    "As dimensões da página e a escala da imagem devem ser números positivos e finitos.",
  "errors.displayScale": "A escala de exibição é inválida.",
  "errors.imageArchiveSize": "O tamanho do arquivo de imagens é inválido.",
  "errors.imageArchiveLimit":
    "Este arquivo de PNGs ultrapassa 128 MB. Exporte menos páginas por vez.",
  "errors.imageRasterLimit":
    "A imagem desta página ultrapassa 32 megapixels. Reduza a escala da imagem.",
  "errors.openProjectSingle": "Abra um projeto de edição por vez.",
  "progress.preparing": "Preparando…",
  "progress.image": "Imagem {{index}} de {{count}}",
  "progress.page": "Página {{index}} de {{count}}",
  "progress.file": "Arquivo {{index}} de {{count}} · {{name}}",
  "progress.analyzing": "Analisando a página {{index}} de {{count}}",
  "progress.recognizing": "Reconhecendo a página {{index}} de {{count}}",
  "progress.ocrEngine": "Carregando o mecanismo de reconhecimento",
  "progress.ocrInitialize": "Inicializando o mecanismo de reconhecimento",
  "progress.ocrLanguage": "Carregando o idioma de reconhecimento",
  "progress.ocrReady": "Preparando o reconhecimento",
  "progress.ocrText": "Reconhecendo texto",
  "progress.ocrPhase": "{{phase}} · {{percent}}%",
  "errors.blankScanImage": "As páginas em branco inseridas não têm imagem digitalizada.",
  "security.importCanceled":
    "A abertura do PDF foi cancelada. Seu documento atual não foi alterado.",
  "security.exportCanceled":
    "A assinatura ou proteção foi cancelada. Nenhum PDF protegido foi baixado.",
  "security.importStopped":
    "A abertura do PDF foi interrompida. Seu documento atual não foi alterado; tente novamente.",
  "security.exportStopped":
    "A assinatura ou proteção foi interrompida. Suas edições continuam disponíveis; tente novamente.",
  "security.importReceive": "Não foi possível receber o PDF desbloqueado. Tente abri-lo novamente.",
  "security.exportReceive": "Não foi possível receber o PDF protegido. Tente exportar novamente.",
  "security.importStart": "Não foi possível iniciar o processo de abertura do PDF.",
  "security.exportStart": "Não foi possível iniciar o processo de assinatura ou proteção.",
  "errors.workerStopped":
    "O processo de PDF foi interrompido. Suas edições atuais continuam disponíveis; tente novamente.",
  "errors.workerStart": "Não foi possível iniciar o processo de PDF.",
  "password.openRequired": "Digite a senha de abertura ou do proprietário deste PDF.",
  "password.openIncorrect":
    "Essa senha não desbloqueou o PDF. Tente a senha de abertura ou do proprietário.",
  "validation.encryptedSource":
    "Os arquivos de origem criptografados precisam de bytes de trabalho e metadados de criptografia.",
  "validation.projectEncryptionVersion":
    "Os arquivos de origem criptografados exigem a versão 2 do projeto ou mais recente.",
  "validation.projectComments": "Os projetos da versão 3 exigem registros de comentários.",
  "validation.projectUtilities":
    "Os projetos da versão 4 exigem registros explícitos de ferramentas.",
  "validation.nameRequired": "Dê um nome ao documento.",
  "validation.fieldNameRequired": "Dê um nome a cada novo campo de formulário.",
  "validation.optionLimit": "Use no máximo {{count}} opções.",
  "validation.optionRequired": "Dê um valor a cada opção.",
  "validation.optionUnique": "Cada opção deve ser única.",
  "validation.fieldRotation":
    "Os campos de formulário aceitam rotações de um quarto de volta (múltiplos de 90°).",
  "validation.radioRotation":
    "Grupos de botões de opção aceitam rotação de objeto de 0°. Gire a página.",
  "validation.number": "{{label}} deve ser um número.",
  "validation.range": "{{label}} deve estar entre {{minimum}} e {{maximum}}.",
  "validation.nameLength": "Os nomes de documentos podem conter no máximo {{count}} caracteres.",
  "validation.fieldDuplicate": "O nome de campo {{name}} já existe. Escolha um nome único.",
  "validation.fieldOptions": "Adicione opções a {{name}}, uma por linha.",
  "validation.fieldChoice": "O valor de {{name}} não é uma das opções disponíveis.",
  "validation.radioOptions": "Adicione botões de opção a {{name}}, um por linha.",
  "validation.radioEnlarge":
    "Aumente o grupo de botões de opção {{name}} para acomodar suas opções.",
  "validation.singleChoice": "O campo {{name}} aceita apenas uma opção selecionada.",
  "validation.checkedValue": "O valor de {{name}} deve estar marcado ou desmarcado.",
  "validation.textValue": "O valor de {{name}} deve ser texto.",
  "validation.choiceValue": "O valor de {{name}} deve ser uma escolha.",
  "validation.radioUnsupported":
    "Os grupos de botões de opção atualmente exigem rotação de objeto igual a zero. A rotação da página é aceita.",
  "errors.destinationCoordinates": "Coordenadas de destino não compatíveis.",
  "errors.bookmarkStyle":
    "Marcadores com estilo ou vinculados à estrutura exigem preservar o catálogo original.",
  "errors.bookmarkAction": "Ação de marcador não compatível.",
  "errors.destinationTree": "Árvore de destinos não compatível.",
  "errors.emptyOutline": "Catálogo de estrutura vazio não compatível.",
  "errors.bookmarkDestination": "Destino de marcador ou link não compatível.",
  "errors.bookmarkDepth": "A hierarquia de marcadores é profunda demais.",
  "errors.bookmarkHierarchy": "A hierarquia de marcadores é inválida.",
  "errors.sourceLinkMissing": "A anotação do link de origem está ausente.",
  "errors.commentRequired": "Primeiro escreva um comentário.",
  "errors.commentLength": "Este comentário é longo demais.",
  "errors.commentPageMissing": "A página deste comentário não existe mais.",
  "errors.commentLimit": "Use no máximo 10.000 comentários por página.",
  "errors.commentThreadMissing": "A conversa deste comentário não existe mais.",
  "errors.commentTextLimit": "Escreva um comentário com no máximo 100.000 caracteres.",
  "errors.commentReadOnlyThread": "Esta conversa contém um comentário somente leitura.",
  "errors.commentCircular": "Este documento contém uma conversa de comentários circular.",
  "errors.commentMissingThread":
    "Este documento faz referência a uma conversa de comentários ausente.",
  "errors.compressionTarget": "Escolha um tamanho de destino válido.",
  "errors.annotationComposition":
    "A composição de páginas não pode preservar relações entre anotações de páginas diferentes. Exporte o documento original completo.",
  "errors.imageMissing": "Uma imagem está ausente neste projeto.",
  "errors.splitOutputRequired": "Escolha pelo menos um arquivo de saída para a divisão.",
  "errors.splitPagesRequired":
    "Cada arquivo resultante da divisão deve conter pelo menos uma página.",
  "errors.splitPageDuplicate": "Escolha cada página apenas uma vez por arquivo de saída.",
  "errors.splitPageOutside": "Uma página da divisão está fora do documento.",
  "errors.commentAnnotationMissing": "Este comentário faz referência a uma anotação PDF ausente.",
  "errors.commentReadOnly": "Este comentário PDF é somente leitura.",
  "errors.commentMarkup": "Este comentário de marcação não pode ser editado.",
  "errors.commentReplyMissing":
    "Este comentário faz referência a uma conversa de respostas ausente.",
  "errors.exportPageMissing": "Uma página para exportação não existe mais.",
  "errors.exportPageDuplicate": "Escolha cada página para exportação apenas uma vez.",
  "errors.exportPagesRequired": "Escolha pelo menos uma página para exportar.",
  "errors.commentGeometry":
    "Este comentário PDF ultrapassa os limites de texto ou coordenadas aceitos.",
  "errors.commentPageLimit": "Este PDF contém mais de 10.000 comentários em uma página.",
  "errors.xfa":
    "Este documento usa formulários XFA que o PDFree não pode editar com segurança. Abra-o em um editor compatível com XFA.",
  "errors.signedInput":
    "Este PDF contém campos de assinatura com certificado. A edição pode invalidar as assinaturas; use uma cópia não assinada.",
  "errors.formControls":
    "Este PDF contém controles de formulário não compatíveis. Use uma cópia sem esses controles.",
  "errors.widgetRotation":
    "Este PDF contém um controle de formulário com rotação não compatível. Use rotações de um quarto de volta.",
  "errors.pdfUnreadable":
    "Não foi possível ler este arquivo como PDF. Ele pode estar danificado ou não ser compatível.",
  "errors.pageUnits":
    "Este PDF usa unidades de página fora do padrão. Converta-o para unidades de página PDF padrão antes de editar.",
  "errors.annotationAppearance":
    "A anotação {{type}} não tem aparência compatível. A disposição de várias páginas por folha não pode incorporá-la com segurança.",
  "errors.annotationTransform":
    "A disposição de várias páginas por folha não pode preservar anotações com zoom ou rotação fixos.",
  "errors.appearanceGeometry": "A geometria da aparência da anotação é inválida.",
  "errors.appearanceEmpty": "A aparência da anotação está vazia.",
  "errors.printFlatten": "Achate os campos antes de preparar um layout de impressão.",
  "errors.printMargins": "As margens não deixam área imprimível.",
  "errors.keepPage": "Mantenha pelo menos uma página ou abra um novo documento.",
  "errors.pageRangeDuplicate": "Uma página aparece mais de uma vez neste intervalo de saída.",
  "errors.pagesRequired": "Escolha pelo menos uma página.",
  "errors.rangeInvalid": "Intervalo de páginas inválido: {{range}}. Use 1-3, 5 ou 7-end.",
  "errors.rangeBounds": "O intervalo de páginas {{range}} deve estar entre 1 e {{count}}.",
  "errors.rangeInteger": "Digite um número inteiro de 1 a {{count}}.",
  "errors.openFirst": "Primeiro abra um PDF.",
  "errors.ruleHeight":
    "O texto da regra de página é alto demais para esta página. Use uma fonte menor.",
  "errors.ruleFont":
    "O texto da regra de página contém caracteres não compatíveis com a fonte PDF.",
  "errors.ruleWidth":
    "O texto da regra de página é largo demais para esta página. Use uma fonte menor ou um texto mais curto.",
  "errors.scopeRange": "Digite páginas como 1-3, 5.",
  "errors.imageDepth": "O aninhamento de recursos de imagem é profundo demais.",
  "errors.imageEncoding":
    "Esta codificação, espaço de cores ou máscara de imagem não pode ser processada com segurança.",
  "errors.imageUnavailable": "O processamento de imagens está indisponível neste navegador.",
  "errors.scanDataLength": "Comprimento inesperado dos dados da imagem digitalizada.",
  "errors.scanSingleImage":
    "A limpeza exige uma única imagem digitalizada direta por página; layouts mistos não são aceitos.",
  "errors.scanColor":
    "Esta página não contém uma imagem digitalizada RGB ou em tons de cinza compatível.",
  "errors.scanStream": "Fluxo de conteúdo digitalizado não compatível.",
  "errors.scanBudget": "O conteúdo digitalizado ultrapassa o limite de processamento.",
  "errors.scanMixedLayout": "A limpeza não pode preservar este layout de página misto.",
  "errors.scanImageUpright": "A limpeza exige uma imagem posicionada sem rotação.",
  "errors.scanTransformUpright": "A limpeza exige transformações de imagem e página sem rotação.",
  "errors.recipientCount":
    "Escolha de 1 a 32 certificados de destinatário, cada um com no máximo 2 MiB.",
  "errors.ownerPasswordRequired":
    "Digite uma senha do proprietário para controlar as permissões do PDF.",
  "errors.passwordsDifferent":
    "Use senhas de abertura e do proprietário diferentes; a senha do proprietário ignora as restrições.",
  "errors.passwordByteLimit": "As senhas PDF devem ter no máximo 127 bytes UTF-8.",
  "errors.passwordNull": "As senhas PDF não podem conter um caractere nulo.",
  "errors.permissions": "Escolha permissões PDF válidas.",
  "errors.certificateFile": "Escolha um certificado PKCS#12 (.p12/.pfx) com no máximo 2 MiB.",
  "errors.certificationPolicy": "Escolha uma política de certificação PDF válida.",
  "errors.signingMetadataLength":
    "O motivo e o local da assinatura devem ter no máximo 1024 caracteres.",
  "errors.certificatePasswordLength":
    "As senhas de certificado devem ter no máximo 1024 caracteres.",
  "errors.projectArchiveSize": "Este projeto tem tamanhos de arquivo inválidos.",
  "errors.projectArchiveLimit":
    "Este projeto ultrapassa o limite de arquivo de 256 MB. Salve menos PDFs de origem.",
  "errors.projectExpandedLimit": "Este projeto ultrapassa o tamanho aceito após a extração.",
  "errors.projectManifestLimit": "O manifesto deste projeto é grande demais.",
  "errors.projectEncryptedBytes":
    "Os arquivos de origem criptografados precisam dos bytes originais e dos bytes de trabalho descriptografados.",
  "errors.projectObjectIdentities": "Este projeto tem identificadores de objeto duplicados.",
  "errors.projectFieldMissing": "Este projeto faz referência a um campo de formulário ausente.",
  "errors.projectPageMissing": "Este projeto faz referência a uma página PDF ausente.",
  "errors.projectImageMissing": "Este projeto faz referência a uma imagem ausente.",
  "errors.projectAnnotationsDuplicate": "Este projeto tem referências de anotação duplicadas.",
  "errors.projectFileMissing": "O arquivo {{path}} está ausente neste projeto.",
  "errors.projectVersion": "Este não é um projeto PDFree compatível das versões 1, 2, 3 ou 4.",
  "errors.projectJson": "O manifesto deste projeto não é um JSON válido.",
  "errors.projectSave": "Não é possível salvar este projeto de edição: {{path}} — {{details}}",
  "errors.projectInvalidValue": "Valor de projeto inválido.",
  "errors.encryptionKeyLength": "Comprimento da chave de criptografia de chave pública inválido.",
  "errors.encryptionVersion": "Versão de criptografia de chave pública não compatível.",
  "errors.encryptionSubfilter": "Subfiltro PDF de chave pública não compatível.",
  "errors.cryptMethod": "Método de filtro criptográfico de chave pública não compatível.",
  "errors.cryptKeyLength":
    "Comprimento da chave do filtro criptográfico de chave pública inválido.",
  "errors.cryptFilter": "Filtro criptográfico de chave pública inválido.",
  "errors.recipientIdentityRequired":
    "Selecione uma identidade de destinatário .p12 ou .pfx e digite sua senha.",
  "errors.cryptFilterMissing": "O PDF faz referência a um filtro criptográfico ausente.",
  "errors.recipientContentMissing": "O PDF não contém conteúdo criptografado para destinatários.",
  "errors.oaepParameters": "Parâmetros RSA-OAEP não compatíveis",
  "errors.rc2KeyLength": "Comprimento efetivo da chave RC2 não compatível",
  "errors.rc2Iv": "O vetor de inicialização RC2 está ausente",
  "errors.recipientEncryption": "Criptografia de conteúdo para destinatários não compatível",
  "errors.envelopeContent": "O conteúdo criptografado do envelope está ausente",
  "errors.envelopePadding": "Preenchimento do envelope de destinatário inválido",
  "errors.rsaPrivateKey": "É necessária uma chave privada RSA",
  "errors.recipientTransport": "Transporte de chave de destinatário não compatível",
  "errors.envelopeType": "A entrada do destinatário não é CMS EnvelopedData",
  "errors.recipientSeed": "Tamanho da semente de destinatário inválido",
  "errors.recipientDecrypt":
    "Esta identidade não conseguiu descriptografar uma entrada de destinatário. Selecione a identidade de destinatário correspondente.",
  "errors.certificateMissing": "O certificado está ausente",
  "errors.certificateKeyMissing": "O certificado ou a chave privada está ausente",
  "errors.recipientUnlock":
    "Não foi possível desbloquear a identidade do destinatário. Verifique a senha, o certificado e a chave privada.",
  "errors.recipientList": "A lista de destinatários do PDF está ausente ou vazia.",
  "errors.recipientEntry": "O PDF contém uma entrada de destinatário inválida.",
  "errors.recipientUnauthorized":
    "Esta identidade não é um destinatário autorizado. Selecione o arquivo .p12 ou .pfx correspondente.",
  "errors.recipientPem": "Não foi possível ler o certificado PEM do destinatário.",
  "errors.recipientCertificate":
    "Escolha certificados X.509 dos destinatários (.cer, .crt ou .pem), sem chaves privadas.",
  "errors.recipientKeyUnsupported": "A chave de criptografia deste destinatário não é compatível.",
  "errors.recipientEncrypt": "A chave do destinatário não conseguiu criptografar este PDF.",
  "errors.recognitionFont":
    "O texto reconhecido contém uma escrita não compatível com a fonte PDF incluída. Revise o reconhecimento antes de exportar.",
  "errors.projectSourceLink": "Este projeto faz referência a um link de origem não compatível.",
  "errors.projectCommentMissing": "Este projeto faz referência a um comentário PDF ausente.",
  "errors.projectReadOnlyComment": "Este projeto altera um comentário PDF somente leitura.",
  "errors.projectCommentProperties":
    "Este projeto altera propriedades não compatíveis de comentários de origem.",
  "errors.scanSource": "A limpeza exige uma página de origem.",
  "errors.selectedPageMissing": "Uma página selecionada não existe mais.",
  "errors.cropMargins": "As margens de recorte devem deixar conteúdo visível na página.",
  "errors.deskewAnnotations":
    "Endireite as páginas antes de adicionar comentários ou campos; a geometria das anotações não pode ser girada com segurança.",
  "errors.cleanedImageMissing": "A imagem da digitalização limpa está ausente.",
  "errors.recipientX509Count":
    "Escolha de 1 a 32 certificados X.509 dos destinatários, cada um com no máximo 2 MiB.",
  "errors.passwordConfirmations":
    "As confirmações das senhas de abertura e do proprietário devem coincidir.",
  "errors.selectText": "Primeiro selecione texto na página PDF.",
  "errors.signaturePlaceholderMissing":
    "Não foi possível localizar o espaço reservado da assinatura PDF.",
  "errors.signaturePlaceholderInvalid": "O espaço reservado da assinatura PDF é inválido.",
  "errors.signatureByteRange": "O PDF é grande demais para o intervalo de bytes da assinatura.",
  "errors.signatureSpace": "A cadeia de certificados ultrapassa o espaço da assinatura PDF.",
  "errors.signatureRequirements":
    "Este campo de assinatura exige valores iniciais ou bloqueios de campos que o PDFree não pode respeitar com segurança. Use uma cópia sem esses requisitos.",
  "errors.signatureUnsigned":
    "Use um PDF não assinado ao adicionar uma assinatura ou certificação PDFree.",
  "errors.pdfCatalogMissing": "A referência ao catálogo PDF está ausente.",
  "errors.signingAlgorithm":
    "O algoritmo de assinatura deste certificado não é compatível. Use RSA ou ECDSA.",
  "errors.signingCertificateRead": "Não foi possível ler o certificado de assinatura.",
  "errors.signingCertificateValidity": "O certificado de assinatura expirou ou ainda não é válido.",
  "errors.signingKeyUsageRead": "Não foi possível ler o uso da chave do certificado de assinatura.",
  "errors.signingKeyUsage": "Este certificado não permite assinaturas digitais.",
  "errors.signingIdentityUnlock":
    "Não foi possível desbloquear o arquivo PKCS#12. Verifique a senha, o certificado e a chave privada.",
  "errors.signingKeyMismatch": "O certificado não corresponde à sua chave privada.",
  "errors.textFont":
    "{{label}} contém caracteres que esta fonte não pode exportar: {{characters}}. Escolha uma fonte compatível ou importe uma imagem de assinatura.",
  "errors.textBox":
    "O texto “{{label}}” não cabe no quadro. Aumente o quadro ou reduza a fonte antes de exportar.",
  "errors.encryptionHandler":
    "Este PDF usa um manipulador de criptografia inválido ou não compatível.",
  "errors.bookmarkIdentities": "Identificadores de marcador duplicados.",
  "errors.pageRulesDuplicate": "Regras de página duplicadas.",
  "errors.pageRuleTarget": "Uma regra de página aponta para uma página ausente.",
  "errors.bookmarkTarget": "Um marcador aponta para uma página ausente.",
  "errors.scanAssetMissing": "A imagem da digitalização processada está ausente.",
  "errors.deskewDestination":
    "O endireitamento não pode preservar este destino posicionado de marcador ou link. Primeiro use um destino de página inteira.",
  "errors.fieldWidgetRotation": "Este controle de formulário usa uma rotação não compatível.",
} as const;
