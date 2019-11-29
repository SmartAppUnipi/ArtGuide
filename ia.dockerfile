FROM python:3.6-slim-buster

MAINTAINER ImageAnalysis

COPY ./image_analysis/app ./app
COPY ./routes.json ./routes.json

RUN pip install -r ./app/requirements.txt

ARG google_key="/app/key/vision_api_keys.json" 
ENV GOOGLE_APPLICATION_CREDENTIALS=$google_key

ARG routes="/routes.json" 
ENV ROUTES_JSON=$routes

EXPOSE 2345

CMD [ "python", "/app/app.py" ]