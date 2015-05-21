# CloudCoreo CLI
======================================================================

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

SubCommands and Actions housed within the stack command will handle all types of AppStack manipulation
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

#### SubCommand: account

work on a CloudCoreo Account
#### Options

```
-h, --help output usage information
-V, --version output the version number
```
#### Actions

##### Action: create

  create a new CloudCoreo account

###### Options:

```
-h, --help output usage information
-u, --username <username> What username to use on your new account
-e, --email <email> What email address to use on your new account
```
###### Examples:

```

This will create a new CloudCoreo account and key pairs
which can be used for accesing your account via the CLI tool.

The cli tool will create a $HOME/.cloudcoreo directory and add a
config file with a JSON representation of the key pair and your username

$ coreo account create -u my_new_username -e me@example.com
```

#### SubCommand: solo

run processes on a stack without a CloudCoreo Account
#### Options

```
-h, --help output usage information
```
#### Actions

##### Action: run

  create a new CloudCoreo account

###### Options:

```
-h, --help output usage information
-p, --profile <profile> the CloudCoreo profile to use. if it does not exist, it will be created and associated with the cloud account
-a, --access-key-id <access-key-id> What amazon aws access key id to use
-e, --secret-access-key <secret-access-key> The secret access key associated with the corresponding access key id
-r, --region <region> The region in which this should be launched. If nothing is specified, it will look to launch in the default region supplied by a aws cli config file. If there is no cli config specified, an error will occur.
```
###### Examples:

```

This will create a new CloudCoreo account and key pairs
which can be used for accesing your account via the CLI tool.

The cli tool will create a $HOME/.cloudcoreo directory and add a
config file with a JSON representation of the key pair and your username

$ coreo account create -u my_new_username -e me@example.com
```
