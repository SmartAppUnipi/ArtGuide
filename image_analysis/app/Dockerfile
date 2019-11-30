FROM python:3.6-slim-buster

MAINTAINER ImageAnalysis

ADD . /app
WORKDIR /app

COPY ./requirements.txt /app/requirements.txt

RUN pip install -r requirements.txt

EXPOSE 2345

CMD [ "python", "app.py" ]