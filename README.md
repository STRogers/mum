# mum

Currently on version: `0.1.0-alpha`

Modern Update Manager (for git only at this time)

---

## Table of Contents

* [Features](#features)
    * [What is "stuff"](#define-stuff)
* [Installing mum](#installing)
    * [Ubuntu / Debian](#installing-debian)
    * [CentOS](#installing-centos)
    * [Mac](#installing-mac)
    * [Windows](#installing-windows)
* [Usage](#usage)
    * [Prerequisites](#usage-prerequisites)
    * [Commands](#usage-commands)
* [Basic Tutorial](#mum-tutorial-basic)
    * [Overview](#tutorial-basic-overview)
    * [Basic Setup](#tutorial-basic-setup)
    * [Installing the Site](#tutorial-basic-installing)
    * [Inspecting the Command](#tutorial-basic-inspecting-command)
* [Advanced Tutorial](#mum-tutorial-advanced)
    * [Overview](#tutorial-advanced-overview)
    * [Basic Setup](#tutorial-advanced-setup)
    * [Installing the Site](#tutorial-advanced-installing)
* [Triggers Tutorial (placeholder)](#mum-tutorial-triggers)
    * [Overview](#tutorial-triggers-overview)
* [Project Motivation](#project-motivation)
* [Project Goals](#project-goals)
* [Mum.json Format](#mum-json)

---

## [Features](id:features)

* Install [stuff](#define-stuff) from a remote git repository to a local directory
* Recursive dependency resolution (Caution: extremely basic implementation)
* Update an existing project without having to pass any arguments to the command.


**What is this version missing that I might expect it to have?**

* Absolutely no cyclic dependency checking. For now you're on your own to make sure you avoid this.
* No dependency version collision detection. Again, you're on your own for now to make sure your dependency chain doesn't rely on two different versions of the same package.
* Tests are not implemented. This is an initial alpha that is essentially a proof of concept. The internal and external APIs are not even close to well defined yet so the value of any automated tests would likely be short lived.


These are clearly significant gaps that need to be addressed sooner rather than later. You can expect at least a basic implementations of all three missing items in the 1.0 release.


**What is this version missing that it will have soon?**

The next items on the roadmap are:

* Triggers - each repository will have a chance to run its own logic before and after installation.
* Install from a local tarball. Dependency resolution will then also look at the tarballs parent directory for other local tarball files before it goes to the net. This allows the possibility for offline installations.

---

### [Define "stuff"](id:define-stuff)

The word "stuff" is used to describe what can be installed rather than "package" or "module" or "code", etc. because in today's complex environments, the installation or deployment of an entire system is rarely just a package or module or a bit of code.

The reality is that we might have a vast array of technologies we rely on that have to be installed and configured properly before the system as a whole will function. One of the primary motivations for creating mum is to help manage that reality and make it easier and faster to deploy complex systems.


**To be clear:** *mum does not care what is inside your repository.* Or, put another way, you can install pretty much _anything_ with mum.

Yep, you read that correctly - just about anything.


---


## [Installing mum](id:installing)

Pre-requisites for installing and using mum: `nodejs (v4.x)`, `git`

#### [Debian / Ubuntu](id:installing-debian)

Ensure prerequisites are installed by running:

```
$ curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
$ sudo apt-get install -y nodejs git
```

To install mum for use globally: `sudo npm install -g mum`

To install mum for use only within the current directory: `sudo npm install mum`

#### [CentOS](id:installing-centos)

These instructions are not yet available. If you know what this process should be please submit a pull request with an update to this section of the readme file.

#### [Mac](id:installing-mac)

These instructions are not yet available. If you know what this process should be please submit a pull request with an update to this section of the readme file.

#### [Windows](id:installing-windows)

These instructions are not yet available. If you know what this process should be please submit a pull request with an update to this section of the readme file.


---


## Usage

### [Prerequisites](id:usage-prerequisites)

* A git repository branch or tag that contains the stuff you want to deploy/install somewhere
* A computer/server to install the [stuff](#define-stuff) to


**Optional:**

* [Optional] A `mum.json` in the root directory of your project
See the [mum.json](#mum-json) section below for details on the `mum.json` format.

### [Commands](id:usage-commands)

* **Install -** Run: `sudo mum install <repositoryUrl>#<branchOrTag> <installationDirectory>`
* **Update -** Change directory to the location of a `mumi.json` file and run: `sudo mum update`

**Note:** `mumi.json` files are generated by mum when `mum install` is run. These are _not_ the same as the `mum.json` configuration files you put in your repositories.


---

## [Basic Tutorial](id:mum-tutorial-basic)

### [Overview](id:tutorial-basic-overview)

To keep the tutorial simple, we will use a static HTML web site (gasp!) that I set up as a [separate GitHub repository](https://github.com/mwhite05/mum-example/tree/basic). The goal is to deploy that web site to a server. Please note that this basic example does _not_ show how to configure or leverage dependencies. See the [Advanced Tutorial](#mum-tutorial-advanced) for that information.

Using mum for deploying a simple static website is perfectly acceptable but might be over the top. I'll leave that for you to judge.

( If you want to follow along, try using a [DigitalOcean](https://www.digitalocean.com/) LAMP one-click install to get a server up and running in about a minute. )


### [Basic Setup](id:tutorial-basic-setup)

1. For this example, the target repository URL will be: `git@github.com:mwhite05/mum-example.git`
2. Inside our *mum-example* git repository we have a branch named `basic` which contains the [stuff](#define-stuff) (in thise case html, css, & images) that we want to deploy or install.
    * We could also use a tag instead of a branch. They work exactly the same way in mum.
3. We also have a server. For clarity, we'll refer to the server as `foxtrot`.
4. Our target installation directory on the `foxtrot` server is `/var/www/html`

You can use whatever user access and permissions level you require but to keep this tutorial as simple as possible we will run all of the following commands as `sudo`.

### [Installing the Site](id:tutorial-basic-installing)

The command to install the site is:

```
sudo mum install git@github.com:mwhite05/mum-example.git#basic /var/www/html
```

That's all it takes to install the site. You're all done.

### [Inspecting the Command](id:tutorial-basic-inspecting-command)

The format is: `mum install <repositoryUrl>#<branchOrTag> <installDirectory>`

* `mum install` tells mum we want to install something
* `git@github.com:mwhite05/mum-example.git` is the git clone url for the repository
* `#basic` tells mum we are installing the stuff in the `basic` branch (or tag).
* `/var/www/html` tells mum where to install the files

Tags and branches are completely interchangeable. This behavior is directly supported by the `git` command line.


---


## [Advanced Tutorial](id:mum-tutorial-advanced)

### [Overview](id:tutorial-advanced-overview)

This tutorial shows an installation with a dependency on a JavaScript file located in a separate repository from the main project. This example is illustrates how you can refer to external dependencies that might contain things such as third party libraries, other internal libraries or modules, configuration data, etc.

### [Basic Setup](id:tutorial-advanced-setup)

We'll use the same repository that we used in the [Basic Tutorial](#mum-tutorial-basic) but this time we're going to use the branch named [`advanced` branch](https://github.com/mwhite05/mum-example/tree/advanced).

If you take a look at the `advanced` branch you'll find a new file named `mum.json`

The contents of `mum.json` are:

```
{
    "dependencies": [
        {
            "url": "git@github.com:mwhite05/mum-example-js.git",
            "version": "master",
            "dir": "./js"
        }
    ]
}
```

This is all that is needed to define one or more dependencies. The file above has just one dependency on the `master` (branch or tag) of the `git@github.com:mwhite05/mum-example-js.git` repository.

The `dir` property tells mum where to install the contents of that repository. In this case `./js` tell mum to use the `/var/www/html/js` directory because dependency directory paths are relative to the installation directory of their parent (in this case we installed the parent to `/var/www/html`).

**Note:** The recursive nature of dependencies means that the installation directory is also recursively relative. If a dependency A defines a dependency B, then the installation directory for dependency B will be relative to the installation directory of dependency A which is itself relative to the installation directory given to the mum command.

### [Installing the Site](id:tutorial-advanced-installing)

To install the site just run:

```
sudo mum install git@github.com:mwhite05/mum-example.git#advanced /var/www/html
```

This looks nearly identical to the basic site we installed earlier except that the branch name was changed.

Mum clones the repository, gathers a list of any dependencies defined in `mum.json` in the repository and clones any repositories listed as dependencies. It does this recursively for each repository it pulls down. It is okay if a repository does not contain a `mum.json` file.

---


## [Triggers Tutorial](id:mum-tutorial-triggers)

### [Overview](id:tutorial-triggers-overview)

Example - maybe something like - removing unwanted files after deployment and setting file permissions and ownership.

(the todo items below are placeholders for later once mum triggers actually exist)

What are mum triggers: todo

What mum triggers are not: todo


**Why triggers instead of more mum configuration properties?**

No one enjoys feeling like they have to learn a whole new markup language just to write a configuration file. Mum doesn't need to do the work for you when it can trigger scripts of any kind. You or your team know how to write those other scripts and you probably have some already written. Why should mum force you to convert those to another format that probably isn't as robust or easy to use as the scripts you already have? The answer: It shouldn't and won't.


---


## [Project Motivation](id:project-motivation)

Today's software is often comprised of many sub-components and it can be a challenge to manage those dependencies and ensure smooth installation and updates.

If you are like many developers today, you no longer work with a single "stack" of software. You might leverage PHP, Python, NodeJS, Go, C, C++, etc. across different server environments.

There are many installation and dependency resolution systems in the wild:

* apt (Debian)
* yum (CentOS / RedHat)
* npm (NodeJS)
* Composer (PHP)
* pip (Python)
* gopm (Go)

These systems all have their place and mum is **not** trying to actually replace them.

Instead, the goal of mum is to give you a way to wrangle all those separate tools into an automated workflow.

Additionally, some software may be stashed away in private access git repositories and so none of the tools above are a good fit there either.

The overarching goal for mum is to provide a single interface with a clean and efficient way to deploy code to any environment from local machines up to production servers for any languages you work with.

Please be aware that this does **not** mean mum is written in all languages. Mum will remain as a nodeJS package that is capable of installing from git repositories and running commands that can leverage any other package manager or script you need to use for deployment.

### [Misc. Information](id:project-motivation-misc-info)

NPM is a popular package manager and chances are; if you found this mum package you already know how npm dependency resolution works.

Because of that fact, mum aims to support at least a subset of the dependency resolution behavior that npm uses. Please note that mum has some distinct differences from the way npm works so in those areas the mum dependency resolution will differ as required.

* [Node JS package definitions](https://docs.npmjs.com/files/package.json#dependencies).
* [Npm semver](https://docs.npmjs.com/misc/semver)

---

## [Project Goals](id:project-goals)

* Provide an update manager that can run on *nix and Windows.
* Language independence. Use the same install tool and update manager for any repository you can access.
* Triggers. React to installation and update triggers within your own software packages.
* Support recursive dependencies with cyclic dependency prevention.
* Support conflict detection in dependency resolution.
* Operate quickly using concurrency where possible. (e.g. clone from multiple repositories at once)

---

## [Mum.json Format](id:mum-json)

Currently the format is _very_ basic. It is just a `dependencies` property that is an array. Each element within the array must be an object with the properties `url`, `version` and `dir`.

* `url` is the URL of the git repository to clone from
* `version` is the git branch or tag name to clone (mum uses single-branch clones for efficiency)
* `dir` is the target installation path for the contents of the cloned branch relative to the installation directory for the repository referencing the dependency.

```
{
    "dependencies": [
        {
            "url": "git@github.com:mwhite05/mum-example-js.git",
            "version": "master",
            "dir": "./js"
        }
    ]
}
```

---

