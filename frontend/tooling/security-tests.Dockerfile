FROM node:24-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl openssl qpdf poppler-utils openjdk-17-jre-headless \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://repo.maven.apache.org/maven2/org/apache/pdfbox/pdfbox-app/3.0.6/pdfbox-app-3.0.6.jar -o /opt/pdfbox-app.jar \
    && echo '28948291a7d6addb91a158292f2e9348d2143720e25a9c87c91bbdd4b088475f  /opt/pdfbox-app.jar' | sha256sum -c -

ENV PDFREE_SECURITY_TESTS=1 PDFREE_PDFBOX_JAR=/opt/pdfbox-app.jar
WORKDIR /workspace
CMD ["node", "node_modules/vitest/vitest.mjs", "run", "--project", "security"]
