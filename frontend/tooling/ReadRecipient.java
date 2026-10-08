import java.io.File;
import java.io.FileInputStream;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdfwriter.compress.CompressParameters;

/** Independent reader for restricted recipient exports; checks flags before removing protection. */
class ReadRecipient {
    public static void main(String[] args) throws Exception {
        try (FileInputStream identity = new FileInputStream(args[1]);
             PDDocument pdf = Loader.loadPDF(new File(args[0]), args[2], identity, null)) {
            if (pdf.getCurrentAccessPermission().canExtractContent() || pdf.getCurrentAccessPermission().canModify()) {
                throw new IllegalStateException("Expected restricted copy and modification permissions");
            }
            pdf.setAllSecurityToBeRemoved(true);
            pdf.save(args[3], CompressParameters.NO_COMPRESSION);
        }
    }
}
