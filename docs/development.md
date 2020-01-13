# Development

For development purposes you will need to install Atom from official website: [atom.io](https://atom.io/).

Clone this repository:
```shell script
$ git clone https://github.com/DeepCodeAI/atom-plugin.git
```

Install npm dependencies:
```shell script
$ npm install
```

Go to the folder with cloned project and create symlink for plugin:
```shell script
$ cd atom-plugin
$ apm link
```

> Read more about [Atom Package Manager](https://flight-manual.atom.io/using-atom/sections/atom-packages/#command-line)

After that you can open any project in Atom and use package `DeepCode`.

> Please, note that right after linking plugin it will not be started automatically and not be 
> presented in the "Packages" menu.
> 
>To see the plugin in the "Packages" menu and start it you have to reload
> Atom window (you can use hotkey Ctrl + Alt + F5)

To remove plugin type:
```shell script
$ cd atom-plugin
$ apm unlink
```
