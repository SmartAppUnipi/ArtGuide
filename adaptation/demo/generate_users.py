import json
import random

# options
# number of generated users
NUM_USERS = 10 
# number of minimum topics that can be assigned to user
USER_MIN_TOPICS = 1 
# number of maximum topics that can be assigned to user
USER_MAX_TOPICS = 4
# list of topics/keywords
TOPICS = [ 'history', 
            'chemistry', 
            'biography', 
            'fun facts',
            'art movements',
            'techniques',
        ]

['history', 'chemistry', 'biography', 'fun facts', 'art movements', 'techniques']

users = []
for i in range(0, NUM_USERS):
    num_topics = random.randrange(USER_MIN_TOPICS, USER_MAX_TOPICS)
    users.append({
        "uid": i,
        "age": random.randrange(1, 70),
        "topics": random.sample(TOPICS, num_topics)
    })
    
with open('users.json', 'w') as outfile:
    json.dump(users, outfile, indent=4)