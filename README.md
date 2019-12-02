# ArtGuide

| branch               |                                                                                                                                               |
|----------------------|:---------------------------------------------------------------------------------------------------------------------------------------------:|
| master               | [![Build Status](https://travis-ci.com/SmartAppUnipi/ArtGuide.svg?branch=master)](https://travis-ci.com/SmartAppUnipi/ArtGuide)               |
| ui                   | [![Build Status](https://travis-ci.com/SmartAppUnipi/ArtGuide.svg?branch=ui)](https://travis-ci.com/SmartAppUnipi/ArtGuide)                   |
| image_analysis_proto | [![Build Status](https://travis-ci.com/SmartAppUnipi/ArtGuide.svg?branch=image_analysis_proto)](https://travis-ci.com/SmartAppUnipi/ArtGuide) |
| ir                   | [![Build Status](https://travis-ci.com/SmartAppUnipi/ArtGuide.svg?branch=ir)](https://travis-ci.com/SmartAppUnipi/ArtGuide)                   |
| adaptation_proto     | [![Build Status](https://travis-ci.com/SmartAppUnipi/ArtGuide.svg?branch=adaptation_proto)](https://travis-ci.com/SmartAppUnipi/ArtGuide)     |

## Information Retrieval module
Please check our [README.md](ir/README.md)

## Adaptation module

The aim of this module is twofold:
1. Expand the words that represent the user's tastes in order to allow SDAIS module to retrieve better pages
2. Perform some analyses on the text returned by SDAIS module and send back the most promising result.
So far, the output text is chosen as follows: all the input texts are labeled with a couple `(difficulty, similarity)` and then sorted by difficulty and then by similarity. Ideally, the fittest text should have the proper lexical and syntactic difficulty and be close to the user's tastes.

### API

The APIs of this module can be found [here](https:http://cipizio.it:4321/).
Notice that the adaptation module will receive 2 different json files from the SDAI module in temporal order, which are called `phase1` and `phase2` respectively.

### Folder structure
Inside `adaptation` folder the following directories can be found:

- data folder contains some examples of text (in .txt format) which should be the input of the text-tailoring functions and some json files, to emulate the REST interaction between modules
- demo folder contains some temporary scripts that have been developed by various members of the team, in order to test some libraries for NLP
- documentation folder contains the source code for the page describing the API
- test folder contains two scripts that allow any user to test the module in local
- document_adaptation folder is the core of the module and provides the functionalities of keword expansion and document adaptation

### Files

- `config.json` contains the config information
- `config.py` reads such file
- `disclaimer.json` contains some strings (for the supported language) that alert the user that the content that he is going to receive is not properly tailored to his expertise level
- `glossario.txt` is thought as an internal file, needed to write code using the same convention for variables and entities
- `main.py` is the code of the server
- `requirements.txt` is the usual file for allowing any user to install the modules required by the software

### Run test
To run some tests locally (and see how adaptation module performs on some sample situations) run `python test_phase1.py --help` (or `python test_phase2.py --help`)

## Docker
You can use Docker to test communications with other modules.

The [docker-compose.yml](docker-compose.yml) defines the containers settings.  
At the moment are available the [ia](ia.dockerfile) and [ir](ir.dockerfile) modules.

Before running docker change [routes.json](routes.json) as follows. Docker containers can access containers in the same network (automatically created by docker-compose) by using the container's name. The adaptation group doesn't have a Dockerfile and anyway is hard to be emulated locally, so they provide an online server, currently located at http://cipizio.it:4321.
```json
{
  "image" : "http://ia:2345/upload",
  "opus" : "http://ir:3000/",
  "text" : "http://cipizio.it:4321/tailored_text",
  "keywords" : "http://cipizio.it:4321/keywords"
}
```

ENV variables with the API keys are needed, contact the teams to get them and please don't put them under version control.

```bash
# start
sudo docker-compose up
# stop
sudo docker-compose down

# build and run single images
sudo docker build -t art/ir -f ir.dockerfile .
sudo docker build -t art/ia -f ia.dockerfile .

sudo docker run --name ir -p 3000:3000 art/ir
sudo docker run --name ia -p 2345:2345 art/ia
```

## Test UI
APIs and communication can be tested by opening in a browser [test.html](test.html) without the need of an emulator for the mobile app.
