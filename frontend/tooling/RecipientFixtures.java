import java.io.File;
import java.io.FileInputStream;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.AccessPermission;
import org.apache.pdfbox.pdmodel.encryption.PublicKeyProtectionPolicy;
import org.apache.pdfbox.pdmodel.encryption.PublicKeyRecipient;

/** Independent, synthetic PubSec producer. No application encryption code is used. */
class RecipientFixtures {
    public static void main(String[] args) throws Exception {
        try (PDDocument pdf = Loader.loadPDF(new File(args[0]))) {
            PublicKeyProtectionPolicy policy = new PublicKeyProtectionPolicy();
            policy.setEncryptionKeyLength(Integer.parseInt(args[2]));
            policy.setPreferAES(Boolean.parseBoolean(args[3]));
            for (int index = 4; index < args.length; index++) {
                try (FileInputStream input = new FileInputStream(args[index])) {
                    PublicKeyRecipient recipient = new PublicKeyRecipient();
                    recipient.setX509((X509Certificate) CertificateFactory.getInstance("X.509").generateCertificate(input));
                    recipient.setPermission(new AccessPermission());
                    policy.addRecipient(recipient);
                }
            }
            pdf.protect(policy);
            pdf.save(args[1]);
        }
    }
}
