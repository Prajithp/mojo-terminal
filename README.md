# mojo-terminal
Interactive bash terminal served by Mojolicious &amp;  websockets 

## Installation 
### docker:
 ```
 $> docker build -t mojo-terminal .
 $> docker run -ti --name mojo-terminal \
    -p 8080:8080 mojo-terminal:latest
 ```

### Install manually:
Make sure you have perl version >= 5.30.
```
cpanm --installdeps .
```
start the application with hypnotoad
```
hypnotoad alertmanager.pl
```


:heart: This project is highly inspired by https://github.com/vti/showmetheshell/ & https://github.com/takluyver/terminado :heart:
