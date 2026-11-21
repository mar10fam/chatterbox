# chatterbox

A group project that will help parents see the progress of their child's speech patterns. We have an AI listening to the speech of the child's voice as they pronounce the picture of the animal that they will be shown during a session. We are hoping our app will capture the responses(if the child said the name of the animal right or wrong) and log them in a supabase database(later to be fetched by supabase as a JSON payload and displayed as a graph to show how they are progressing in a specific letter.). An example of a session can be viewed as this:

How a session goes:

1. Session 1 is with Client Adam
2. Picture of a Rabbit is displayed 
3. Child pronounces it 
4. AI judges it and logs
5. Parents can view the progress of that session and see if there needs to be a change or more practice. 