## Configuration

To configure cloudcoreo-cli you must have a CloudCoreo account. If you do not, please sign up for one

[You can sign up here](https://www.cloudcoreo.com/)

After completing the registration, you can 'login' with the CloudCoreo cli.

```
coreo login --username <my_cloudcoreo_username>
```

This will prompt you for your password.

Assuming your credentials entered are accurate, a `config` file will be create in `$HOME/.cloudcoreo/`

Each login will invalidate all other cli instantiations forcing you re-login on eaech machine you run from.

