FROM eclipse-temurin:17-jdk

RUN apt-get update \
    && apt-get install -y --no-install-recommends xvfb imagemagick x11-apps fonts-dejavu-core libxtst6 x11vnc novnc websockify openbox \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

CMD ["sh", "-c", "javac Code.java && java Code"]
