# Going Down the Garden Path

**Fat people eat accumulates.** 

Now either your wondering what snack is named 'accumulates', or you reread the sentence to figure out it does actually make sense grammatically. It might take some time to unfold its meaning, but try to do so before reading further. 

**SPOILER AHEAD**

Instead of talking about 'fat people' eating 'something', it's rather 'fat **that** people eat accumulates'. Its the fat that is accumulating, not the person. Reading this sentence for the first time threw me off guard, and it took me quite some brainpower to be able to reread it normally. 

This phenomenon is called a *garden path sentence*, and its something I encountered a lot in my studies. What makes it interesting is that it gives us some insight into how we parse sentences in our head, as we are making assumptions of what words are coming up, and grouping them on the fly instead of waiting for the whole sentence to finish. 

#### Slideshow of different garden paths
```Slides of different sentences, showing the different english structures
NP/Z, While the man hunted **the deer** ran…
NP/S, understood **the contract** would…
Reduced relative, The woman **brought** the sandwich tripped
```

Interestingly (to me at least), this predictive nature is exactly what most language models currently do as well.[^1] And in comparison to humans, we can actually look into the 'brain' of these models to see how surprised they are when they encounter this linguistic rarity.  

## Garden paths

Back to garden path sentences (and for me back to my humble UU beginings). In order to explain how these sentences work, we have to look at how sentences are usually constructed. Sentences are made up of individual parts, that merge together through grammar to make a complete sentence. One way to visualise how such sentence is constructed, is through *consituency graphs*, which essentially show you to which group (or constituent) each word belongs. The easiest way is to just go through the example from before:

### SCROLLYTELLING GRAPH:
```
#### Step 1

**Text:** _Fat_. An adjective. We need a bit more to form a sentence (unless your insulting someone I guess.)

**Tree:** Only the word **Fat**, with **Adj** above it, both highlighted.

#### Step 2

**Text:** _people_. Fat people: an adjective and a noun, together a noun phrase.

**Tree:** **people** appears with **N** above it. An **NP** forms over _Fat_ and _people_. What’s new is highlighted (people, N, NP and its branches).

#### Step 3

**Text:** _eat_: a verb, so fat people eat… something. You already have a slot ready for what they eat: hamburgers, salads, nuts...

**Tree:**

- **eat** appears with **V** above it.
- **VP** and **S** appear on top, so now it’s S → NP + VP. These are highlighted.
- Under VP there’s a dashed, faint branch to an **NP** → **N** → _hamburgers?_ (faint, italic). That’s the slot you’re expecting to fill.

#### Step 4

**Text:** _accumulates_. That’s a verb, not a noun, and it doesn’t fit the slot. This is where your brain has to stop, and has to go back to recover.
_(“doesn’t fit the slot” is in the accent colour.)_

**Tree:**

- _hamburgers?_ turns into **accumulates.**, with **V** above it.
- The expected slot is now labelled **NP?**, still dashed: a noun slot with a verb in it.
- The clash is highlighted (accumulates, V, NP?, the dashed branch); the rest of the tree is muted.

#### Step 5

**Text:** So you back up. The tree comes apart, and you start doubting the words you were sure of. What was _Fat_ doing there?

**Tree:**

- Every phrase (S, NP, VP, NP?) and every branch between them disappears.
- Only the word labels stay: **N** people, **V** eat, **V** accumulates.
- _Fat_ gets a highlighted **?** instead of Adj.

#### Step 6

**Text:** _Fat_ wasn’t an adjective, it was the noun: the fat (that) people eat. _eat_ moves down into a relative clause about the fat, and _accumulates_ is the verb the sentence was waiting for.  
_(“the fat (that) people eat” is in the accent colour.)_

**Tree:** the correct tree builds, and what’s new is highlighted:

- _Fat_ becomes **N**.
- A faint italic _(that)_ slides in after Fat, with **C** above it.
- _people eat_ moves into a relative clause (**RC**) under the subject NP: RC → C (that) + NP (people) + VP (eat).
- **accumulates** gets the main **VP**.

The full structure is S → [NP: Fat + RC] + [VP: accumulates].

#### Step 7

**Text:** Fat (that) people eat accumulates. You can finally rest again

**Tree:** The same correct tree, now all muted with nothing highlighted; _(that)_ stays faint.

```
### continuing
Isn't that fascinating? I always thought these sentences where supercool and creating these graphs felt like solving a puzzle. At some point I would say the logic behind these graphs start to fall apart, as there is a lot of clauses being swapped ones you start with subsentences, relative clauses and internal references. I was able to dig up some of the (insane) graphs we had to create, all while having to convince everyone that linguistics was more than just learning grammar. 

[PICTURE OF MY NOTES]
Caption: A selection of notes I could find in conversation with fellow linguistics students back in the day. Shoutout Moon People (Koen Maarten & Fleur)

Anyway, back to garden paths. There are many more versions, and they don't only appear in English. English has a few different version though, while languages like Dutch or German essentially only have one kind of structure that allows it. The so called 'conjunction coordination' or simply just using 'and' in a suprising manner. 

| English  | Example as garden sentence, and then shown with the correct brackets |
| -------- | -------------------------------------------------------------------- |
| Dutch    |                                                                      |
| German   |                                                                      |
| French   |                                                                      |
| Arabic?  |                                                                      |
| Chinese? |                                                                      |

## subsection?

There has been a lot of psycholinguistic research about what goes on in the brain when people encounter such sentences.[^2] Now I thought I was the only one who had made the connection to the was current language models generate (token by token), but of course I was wrong. I was first a bit disappointed (like always, everything you thought of has already been done), but then I realised I could just use their work to explore for myself. win-win. 

There were some English datasets available but I wanted to ideally compare the results with Dutch and German, as I am (too) slowly turning into a true trilingual. Through some digging in OSF I found a Dutch dataset and could just translate that into a German one to see how well it performs. Then my small experiment is quite simple: run these sentences through the model word for word, look at the probability of the next word, and see how 'suprised' the model is after seeing the unexpected word. 
#### GIF SHOWING THE PROCESS OF GUESSING THE PROBABILITIES. 
![](img/PXL_20261119_172944287.MP.jpg)

### Looking inside the brain

Well, turns out we're not yet near AGI.[^3] All models are suprised to see the word pop up, across languages and across types of garden paths. Some sentences worked better than others, which is probably due to the fact that some are just more famous examples ("The horse ran past the barn fell"). The one in our example is clearly not obvious though, as the expected next level token is much less likely than in the control sentence. 

Now I realised I dont actually care about this numbers or the tables it produced. I just want to see what the model 'thinks' when it sees such sentences, and looking at the aggragate scores, or which model is better than the other is something I just do in my job, but I (luckily) don't have to follow those rules here. So let's just stick with our example sentence for now. 

The nice thing with models, is that similar to eye tracking data in humans, we can actually see what the modle is paying attention to. This 'attention' is what essentially started (or at least was quite a big turnaround) the neural language model hype, which was the first domino to the largest IPO in the world[^4]. Anyway, attention is essentially the model linking words together, or you could argue its creating its own *constituents* (like we had in the graph from before). [^5]

Lets look at our example again, and compare it to the version that has **that**. We look at the *attention* the model has related to each preceding word, which is essentially what the model is looking at when it reads the next word. 

#### Scrollytelling of the attention heads


### The real garden path

What a trip down memory lane[^6]. I have to say that even though I miss the pre-LLM (computational) linguistics, I am also grateful I never have to draw these graphs anymore. Doing it now made me happy though, and being able to connect my current work a bit to my past made me realise how much this domain has changed. At the same time, I would never had the time to set up the testing environment this quickly, or create the animations to visualise my intuition, if it wasn't for the field evolving the way that it has. 

Hope it was half as interesting to read as it was to write. I'm off touching grass (cringe) on a real garden path and climb up the Uetliberg instead of spending more hours behind my screen. 

### Technical report 
Dataset: 
Models trained: 
Results: 
Coding assistant


[^1]: At least what decoder-only models do. And of course not looking at the post training steps (RLHF, DPO etc.) 

[^2]: I could technically look up a reference for these claims, but since this I'm just writing this for fun you just gotta believe me. 

[^3]: Not that someone though a 1.5B model would be close but still.

[^4]: Anthropic has gone to market for a whopping 1.5 million million. 

[^5]: This is quite a claim, but my Chomskian education is biasing me to the existance of a universal grammar. I don't think its really the case, and I am sure models don't really use grammar but rrather rely on distributional semantics, but it at least connects my graphs from earlier to the attention in transformer models. 

[^6]: I think there is a joke here with memory **lane** and garden **path**, but i can't think of one. Be my guest!
