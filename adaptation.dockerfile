FROM python:3.7

COPY ./adaptation/requirements.txt /art/adaptation/requirements.txt
RUN pip install -r /art/adaptation/requirements.txt

COPY ./adaptation /art/adaptation
COPY ./routes.json /art/routes.json

EXPOSE 6397

CMD python /art/adaptation/main.py