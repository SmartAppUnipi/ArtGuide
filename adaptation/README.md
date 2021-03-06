# Adaptation module

The aim of this module is twofold:
1. Expand the words that represent the user's tastes in order to allow SDAIS module to retrieve more fitting pages
2. Perform some analyses on the text returned by SDAIS module and send back the most promising result.
So far, the output text is chosen as follows: all the input texts are labeled with a couple `(difficulty, similarity)` and then sorted by difficulty and then by similarity. Ideally, the fittest text should have the proper lexical and syntactic difficulty and be close to the user's tastes.

## API

The APIs of this module can be found [here](https:http://cipizio.it:4321/).
Notice that the adaptation module will receive 2 different json files from the SDAIS module in temporal order, which are called `phase1` and `phase2` respectively.

## Folder structure
Inside `adaptation` folder the following directories can be found:

- data folder contains some examples of text (in .txt format), which should be the input of the text-tailoring functions and some json files, to emulate the REST interaction between modules
- demo folder contains some temporary scripts that have been developed by various members of the team, in order to test some libraries for NLP
- documentation folder contains the source code for the page describing the API
- test folder contains two scripts that allow any user to test the module in local
- document_adaptation folder is the core of the module and provides the functionalities of keyword expansion and document adaptation

## Files

- `config.json` contains the config information
- `config.py` reads such file
- `data_visualization.ipynb` is a Jupyter Notebook for seeing graphically the distance between words and sentences
- `disclaimer.json` contains some strings (for the supported language) that alert the user that the content that he is going to receive is not properly tailored to his expertise level
- `glossario.txt` is thought as an internal file, needed to write code using the same convention for variables and entities
- `main.py` is the code of the server which calls the utility functions and classes defined in the folder `document_adaptation`
- `requirements.txt` is the usual file for allowing any user to install the modules required by the software
- `test_text_semantic_search.py` is a script for testing the application locally on some examples

## Getting ready
First of all you need to install the dependencies by running `pip install -r requirements.txt`. 
Then you need to start the server by moving into the adaptation directory and to run `python main.py`.
Now you are ready to start some tests!

## Run test
To start some tests locally (and see how adaptation module performs on some sample situations) run `python test_phase1.py --help` (or `python test_phase2.py --help`)

## Debug clusters on TensorBoard
Now you can visualize the embeddings space labeled by clusters and other useful informations using TensorBoard or [Embedding Projector](http://projector.tensorflow.or/).
All files are stored in `./visualizer_logs/` divided by request.



