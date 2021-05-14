FROM perl:5.32.0

WORKDIR /app
EXPOSE 8080

COPY . /app/
RUN cpanm --notest --installdeps . -M https://cpan.metacpan.org && \
    rm -r /root/.cpanm

ENTRYPOINT ["hypnotoad", "--foreground", "/app/Terminal"]
