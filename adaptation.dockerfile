FROM python:3.7

COPY ./adaptation/requirements.txt /art/adaptation/requirements.txt
RUN pip install -r /art/adaptation/requirements.txt

COPY ./adaptation/document_adaptation /art/adaptation/document_adaptation
COPY ./adaptation/*.py /art/adaptation/
COPY ./routes.json /adaptation/routes.json

EXPOSE 6397

CMD python /adaptation/main.py

