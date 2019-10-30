# Start server
Start server on port 5000
```
$ env FLASK_APP=flask_test.py flask run
```
# Client
```
curl -X POST -F "file=@resources/images_test.jpg" localhost:5000/upload
```

