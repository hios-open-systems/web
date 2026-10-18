Ok, podriamos agregar un sistema o flujo de release de bt desde la ui del pad?
Que mas podriamos revisar?
Como hago para meter el daemon local de forma que arranque o bien con un comando desde cualquier lado o bien cuando arranque la compu?

Que mas data podria pasar cuando funcione el daemon?


Con respecto a arrancarlo asi:
╭─juanjoparedez@ntb ~/proyects/web ‹main●› 
╰─$ npm --prefix projects/pad/companion start


> pad-companion@0.1.0 start
> node dist/index.js

[15:19:49] pad-companion -> http://hiospad.local/api/state  cada 1000ms  (linux)
[15:19:50] conectado al pad ✓





Me obliga a tener la terminal encendida para que corra no?

╭─juanjoparedez@ntb ~/proyects/web ‹main●› 
╰─$ sudo btmgmt find -l | grep -i '10:20:BA'

[sudo] password for juanjoparedez: 
╭─juanjoparedez@ntb ~/proyects/web ‹main●› 
╰─$                                                                                                          1 ↵




