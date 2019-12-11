FROM python:3.6-slim-buster

MAINTAINER ImageAnalysis

COPY ./image_analysis/app /image_analysis/app/

RUN pip install -r /image_analysis/app/requirements.txt

EXPOSE 5000

CMD [ "python", "/image_analysis/app/server_prova.py" ]
