# :bank: HackSBC :bank:
__The main code repo for HackSBC project.__

***

### :busts_in_silhouette: Authors
 - Charlotte Kexin Zhu (@kzhu99166)
 - Cindy Ou Yang (@cindyou11)
 - Eric Minghao Yang (@ericmyang)
 - Etienne Le Bouder (@elebouder)
 - Joshua Rayo (@jrayo123)
 - Owen Yicheng Tsai (@owentsai)

### :snake: Setting up your Python local development environment for the first time

If you want to test your cloud functions locally, you need to We're going to use [`pyenv`](https://github.com/pyenv/pyenv) with [`pyenv-virtualenv`](https://github.com/pyenv/pyenv-virtualenv) below. For Windows, you can use [`pyenv-win`](https://github.com/pyenv-win/pyenv-win) and [`virtualenvwrapper`](https://virtualenvwrapper.readthedocs.io/en/latest/), which basically does the same things.

* Install homebrew if you don't have it.
```
# Mac: Simply run this command
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

# Homebrew on Linux: https://docs.brew.sh/Homebrew-on-Linux
```

* Install `pyenv` and `pyenv-virtualenv`

> `brew install pyenv && brew install pyenv-virtualenv`

* Add `pyenv init` and `pyenv virtualenv-init` to your shell.
> ` echo -e 'if command -v pyenv 1>/dev/null 2>&1; then\n  eval "$(pyenv init -)"\nfi \n if which pyenv-virtualenv-init > /dev/null; then eval "$(pyenv virtualenv-init -)"; fi' >> ~/.bash_profile
`


* Install Python 3.7.1 via `pyenv`: `pyenv install 3.7.1`
> [Source](https://cloud.google.com/functions/docs/concepts/python-runtime): The Cloud Functions Python runtime is based on Python version 3.7.1. 

* Create our virtual environment: `pyenv virtualenv 3.7.1 hacksbc`. Then go to the root directory of our repo, run: `pyenv local hacksbc`. From now on, the virtual environment will always automatically activate when you are in any folder in the repo. You should see `(hacksbc)` appearing on the left of your prompt line. 
