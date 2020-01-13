# DeepCode package for Atom

> Package is still in active phase of development

Atom package provided by <a href="https://www.deepcode.ai/">DeepCode.ai</a> to detect important bugs and issues
in your code. Supports Java, Python, JavaScript, TypeScript and XML.

DeepCode's AI algorithms continuously learn from bugs and issues fixed on open source
repos. The extension will automatically alert you about critical vulnerabilities you need to solve
in your code every time you save a file. Don't let security bugs go to production. Save time
finding and fixing them.

# How it works

Login Deepcode extension using your GitHub, BitBucket or GitLab account:

![login](images/login.png)

Confirm uploading your code to DeepCode server. Your code is protected and used only for the purpose of
informing you about issues in code:

![confirm](images/confirm.png)

DeepCode extension analyses code on saving files:

![deepcode progress](images/progress.png)

Inspect all found issues using "Problems" tab and syntax highlight:

![deepcode problem](images/problem.png)

# Available commands from status bar button

### Open panel

Opens panel with list of problems and makes request for checking analysis status.
If there is no created bundle and changed files are present, it starts creating bundle process.

### Scan project

Makes full re-scan of project and marks all files as changed,
so they will be uploaded to server and analyzed.

This command always creates a new bundle.

### Settings

Opens settings view for package.

### Reset plugin

Removes all stored info about plugin: login, project data. It behaves like you install the plugin
at first time: you will be asked for login, confirmation folders and so on.

Can be useful for development purposes or for changing settings.

> Please, note that this command doesn't reset any global package settings that are available
> on settings view (menu "Packages" -> "Settings view" -> "Manage packages" -> "DeepCode"). 
