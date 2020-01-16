FROM python:3.7

# install requirements
COPY ./requirements.txt /art/adaptation/requirements.txt
COPY ./document_adaptation/sister-0.1.5 /art/adaptation/document_adaptation/sister-0.1.5
WORKDIR /art/adaptation
RUN pip install -r requirements.txt

# copy app and routes.json
COPY . /art/adaptation

# ENV variables
ENV SISTER_CACHE_ROOT="/art/adaptation/sister_cache"

# port
EXPOSE 6397

# run
CMD python main.py