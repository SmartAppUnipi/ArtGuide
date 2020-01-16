FROM python:3.6-slim-buster

# install git required for requirements.txt
RUN apt update
RUN apt install -y git

# classification requirements
COPY ./classification/requirements.txt /art/image_analysis/classification/requirements.txt
RUN pip install -r /art/image_analysis/classification/requirements.txt

# app requirements
COPY ./app/requirements.txt /art/image_analysis/app/requirements.txt
RUN pip install -r /art/image_analysis/app/requirements.txt

# copy app and routes.json
COPY . /art/image_analysis

# ENV variables and keys
ENV ROUTES_JSON="/art/routes.json"
ENV MODELS_DIR_PATH="/art/image_analysis"
ENV GOOGLE_APPLICATION_CREDENTIALS="/art/image_analysis/app/key/vision_api_keys.json"

# port
EXPOSE 2345

# run
WORKDIR /art
CMD python image_analysis/app/app.py