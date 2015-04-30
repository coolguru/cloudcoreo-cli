# CloudCoreo CLI
======================================================================
The CloudCoreo CLI allows you to install Cloud Stacks. CloudCoreo is a package manager for the cloud.
Version: 0.0.1
License: Apache 2.0

## Install CloudCoreo CLI tool

Installation is simple and managed via NPM. For a global install (reccomended) run:

```
npm install -g cloudcoreo-cli
```

## Commands

The following is a list of commands that can be run with the CLI tool. This is auto-generated.

### Command: **coreo**

#### Options

```
-h, --help output usage information
-V, --version output the version number
```

### SubCommands

The CloudCoreo CLI uses git-style subcommands.
For help, try:
```
coreo help <command>
```
or
```
coreo <command> help <subcommand>
```

#### SubCommand: init

The init command houses everthing necessary to create new AppStacks
#### Options

```
-h, --help output usage information
-V, --version output the version number
-D, --directory <fully-qualified-path> the working directory
```
#### Actions

##### Action: new-stack

  new description

###### Options:

```
-h, --help output usage information
-s, --stack-type <stack type> What will this stack be? (server | stack)
```
###### Examples:

```

Excluding the -D (--directory) option assumes your working directory is
where your AppStack exists

$ coreo init new-stack -s server
$ coreo init new-stack --stack-type stack
```

#### SubCommand: stack

SubCommands and Actions housed within the stack command will all all types of AppStack manipulation
#### Options

```
-h, --help output usage information
-V, --version output the version number
-D, --directory <fully-qualified-path> the working directory
```
#### Actions

##### Action: add

  Add a sibling stack

###### Options:

```
-h, --help output usage information
-s, --stack-type <stack type> What will this stack be? (server | stack)
-n, --stack-name <stack name> The name you would like to give to the sibling stack
-g, --from-git <git ssh url> The git ssh url from which this stack will be extended.
```
###### Examples:

```

Excluding the -D (--directory) option assumes your working directory is
where your AppStack exists

This command will add a VPN server to your AppStack

$ coreo stack add -s "server" -g "git@github.com:CloudCoreo/servers-vpn.git" -n "vpn"
$ coreo stack add --stack-type "server" --from-git "git@github.com:CloudCoreo/servers-vpn.git" -stack-name "vpn"
```
##### Action: extend

  Extend a stack

###### Options:

```
-h, --help output usage information
-g, --from-git <git ssh url> The git ssh url from which this stack will be extended.
```
###### Examples:

```

Excluding the -D (--directory) option assumes your working directory is
where your AppStack exists

This command will set your AppStack up to extend the CloudCoreo VPC

$ coreo stack extend -g git@github.com:cloudcoreo/cloudcoreo-vpc
```
