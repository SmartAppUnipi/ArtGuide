FROM python:3.6-slim-buster

COPY ./image_analysis/app/requirements.txt ./app/requirements.txt
RUN pip install -r ./app/requirements.txt

COPY ./image_analysis/app ./app
COPY ./docker.json ./routes.json

ENV GOOGLE_APPLICATION_CREDENTIALS="/app/key/vision_api_keys.json"
ENV ROUTES_JSON="/routes.json"

EXPOSE 2345

CMD [ "python", "/app/app.py" ]