FROM python:3.6-slim-buster

COPY ./image_analysis/app/requirements.txt /art/image_analysis/app/requirements.txt
RUN pip install -r /art/image_analysis/app/requirements.txt

COPY ./image_analysis/app /art/image_analysis/app
COPY ./routes.json /art/routes.json

ENV GOOGLE_APPLICATION_CREDENTIALS="/art/image_analysis/app/key/vision_api_keys.json"
ENV ROUTES_JSON="/art/routes.json"

EXPOSE 2345

CMD python /art/image_analysis/app/app.py