# CloudCoreo CLI
======================================================================

## Install

Installation of the [CloudCoreo](http://www.cloudcoreo.com/) CLI tool is simple and managed via NPM. For a global install (recommended) run:

```
npm install -g cloudcoreo-cli
```

## Commands

The following is a list of commands that can be run with the CLI tool. This is auto-generated.

##### Options

```
-h, --help output usage information
-V, --version output the version number
```

The [CloudCoreo](http://www.cloudcoreo.com/) CLI uses git-style subcommands.
For help, try:
```
coreo help <command>
```
or
```
coreo <command> help <subcommand>
```

### coreo init

The init command houses everything necessary to create new AppStacks
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

### coreo stack

Subcommands and Actions housed within the stack command will handle all types of AppStack manipulation
#### Options

```
-h, --help output usage information
-V, --version output the version number
-i, --id <appstack_id> the id of the appstack you want to list the versions of
-D, --directory <fully-qualified-path> the working directory
-p, --profile <profileName> What profile name to use - default is ['default']
```
#### Actions

##### Action: list

  the stack versions running in your CloudCoreo account

###### Options:

```
-h, --help output usage information
```
###### Examples:

```

This list all of the stack versions running in your CloudCoreo account.
You must supply a profile name or it will assume [default].

$ coreo stack list
-= OR =.
$ coreo --profile myprofile stack list
```
##### Action: list-versions

  the versions of the AppStacks running in your CloudCoreo account

###### Options:

```
-h, --help output usage information
```
###### Examples:

```

This list all of the stack versions running in your CloudCoreo account.
You must supply a profile name or it will assume [default].

You must also supply a Stack ID or partial ID. If you supply a partial
id, CloudCoreo will assume you want to see all versions from all matching
AppStacks. For instance, if you want to see version information for an
AppStack with id=543ee6737dd1, you can supply that id with:
--id 543ee6737dd1
On the other hand, you can supply a value of:
--id 5
and CloudCoreo will return all versions for all AppStacks with ids begining
with the number 5

$ coreo stack --id 543 list-versions
-= OR =.
$ coreo --profile myprofile stack --id 543 list-versions
```
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

### coreo account

Subcommands for interacting with logged-in CloudCoreo Accounts
#### Options

```
-h, --help output usage information
-V, --version output the version number
-p, --profile <profileName> What profile name to use - default is ['default']
```
#### Actions

##### Action: test

  link your CLI with an existing CloudCoreo account

###### Options:

```
-h, --help output usage information
-u, --username <username> What username do you use with your CloudCoreo account
-e, --email <email> What email do you use with your CloudCoreo account
```
###### Examples:

```

This will associate a CloudCoreo account with the CLI tool account
and add a profile to your $HOME/.cloudcoreo/config file

$ coreo account link -u my_username
-= OR =.
$ coreo account link -u my_username
```
##### Action: link

  link your CLI with an existing CloudCoreo account and upsert api keys

###### Options:

```
-h, --help output usage information
-u, --username <username> What username do you use with your CloudCoreo account
-e, --email <email> What email do you use with your CloudCoreo account
```
###### Examples:

```

This will associate a CloudCoreo account with the CLI tool account
and add a profile to your $HOME/.cloudcoreo/config file

NOTE: This method will create or update api keys. If you need to rotate
credentials, simply run this command and old keys will be
invalidated and replaced with new ones

$ coreo --profile myprofile account link -e my_email@example.com
-= OR =.
$ coreo --profile myprofile account link -u my_username
```
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
which can be used for accessing your account via the CLI tool.

The CLI tool will create a $HOME/.cloudcoreo directory and add a
config file with a JSON representation of the key pair and your username

$ coreo account create -u my_new_username -e me@example.com
```

### coreo test

teest aspects of your stack
#### Options

```
-h, --help output usage information
-V, --version output the version number
-D, --directory <fully-qualified-path> the working directory
```
#### Actions

##### Action: variables

  that all variables are exposed in the top level variable file

###### Options:

```
-h, --help output usage information
```
###### Examples:

```

Excluding the -D (--directory) option assumes your working directory
```

### coreo solo

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
which can be used for accessing your account via the CLI tool.

The CLI tool will create a $HOME/.cloudcoreo directory and add a
config file with a JSON representation of the key pair and your username

$ coreo account create -u my_new_username -e me@example.com
```
