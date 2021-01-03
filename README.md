# MAT CLI

This CLI tool is for managing your MAT installation.

```
Usage:
  mat [options] list-upgrades [--pre-release]
  mat [options] install [--pre-release] [--version=<version>] [--mode=<mode>] [--user=<user>]
  mat [options] update
  mat [options] upgrade [--pre-release] [--mode=<mode>] [--user=<user>]
  mat [options] version
  mat [options] debug
  mat -h | --help | -v

Options:
  --dev                 Developer Mode (do not use, dangerous, bypasses checks)
  --version=<version>   Specific version install [default: latest]
  --mode=<mode>         MAT installation mode (dedicated or addon, default: dedicated)
  --user=<user>         User used for MAT configuration [default: root]
  --no-cache            Ignore the cache, always download the release files
  --verbose             Display verbose logging
```

## Issues

You can open any issues at the [mat-cli repo](https://github.com/digitalsleuth/mat-cli/issues).

## Installation

1. Download the mat-cli-linux file: `wget https://github.com/digitalsleuth/mat-cli/releases/latest/download/mat-cli-linux`
2. Download the mat-cli-linux.sha256.asc file: `wget https://github.com/digitalsleuth/mat-cli/releases/latest/download/mat-cli-linux.sha256.asc`
3. With both files in the same directory, verify the sha256sum of the binary: `sha256sum -c mat-cli-linux.sha256.asc`
    * If you see an error about improperly formatted lines, it can be safely ignored. The important thing is that before that it says 
      `mat-cli-linux: OK`
4. Move the mat-cli-linux file to /usr/local/bin/mat: `sudo mv mat-cli-linux /usr/local/bin/mat`
5. Make the mat binary executable: `sudo chmod +x /usr/local/bin/mat`
6. Install using the above options.

## Addon Mode

This will only install the packages and necessary configurations to the current system, for the current user. No icons, desktop theme changes or menu options are modified.

## Dedicated Mode

This will install the full Toolkit into the current environment, desktop and all. The current desktop environment for MAT is Ubuntu Budgie. Icons and menus will be created, background and hostname will be
changed, and the ssh service will be stopped.
