# hackathon-airportoffuture-changi
Hackathon project called 'Changi Responder', where Singapore execs came to Silicon Valley for Airport of the Future hackathon.

Our idea was inspired by SIMS game. Think of it as SIMS for the Airport. It was a hackathon where robots (SoftBank PEPPER) were available
to dispatch for help when in need. If there was an SOS call, robot close by will come to the traveler and it can answer their questions.

## What we did
 
### Gate Path Finding 
 1. Download a jpg map from changi website
 2. Preprocess the map in HTML Canvas to extract gate information.
 3. Use A* path finding algorithm to find the fastest path to a gate. 
 3. Optimize paths so that Monorails are faster than walking.
 
### QnA to Management Administration
 1. Create a dashboard where we see airport incidents.
 2. When an incident occured, flash that area. So the support will know the health of the airport.
 3. Dispatch a robot to that area when close by.
 4. Accept feedback from travelers.
 5. Answer question such as, how far is gate f20.
 
### Robot Control
 1. Navigates to the desired location.
 2. Answers two questions, as mentioned prior. 
 3. Shows emotion and direction when answering how far is gate f20. 
 
## Cool things to expand if given time
 1. Use robotic arm to point to the right direction. We already calculated data, path finding.
 2. Answer more questions, more QnA. Would be cool to integrate to Microsoft Cognitive Services for AI
 3. Better UI, we didn't have a designer and short of devs

 
