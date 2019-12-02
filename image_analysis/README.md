# Image analysis module
The module is made of two submodule: *app* and classification. *App* is the submodule which serves the result to the opus endpoint, classification is the submodule used by App to obtain part of the information about an artwork. **Note: the classification submodule will be used in beta**

**Note: Google vision Api key are not in the version control, ask to out team to receive the credentials**

# App submodule
Before starting the *app*, install the requirements listed in the file *ArtGuide/image_analysis/app/requirements.txt* 
```
$ pip install -r ArtGuide/image_analysis/app/requirements.txt
```
To start the service set the *GOOGLE_APPLICATION_CREDENTIALS* such that it contains the absolute path to the Google Cloud Vision API key and the *ROUTES_JSON* pointing to the routes.json file (also absolute path). Then, from the project root (ArtGuide directory) start *app.py*
```
$ GOOGLE_APPLICATION_CREDENTIALS=~/Desktop/Projects/ArtGuide/image_analysis/app/key/vision_api_keys.json ROUTES_JSON=~/Desktop/Projects/ArtGuide/routes.json python image_analysis/app/app.py
```

# Container deployment
Build the container from the project root.
```
$ docker build -t art/ia -f ia.dockerfile
```
The paths for the google application keys and the routes must be respectively "./image_analysis/key/vision_api.json" and "/routes.json". Then just run
```
$ docker run -p 2345:2345 art/ia
```

