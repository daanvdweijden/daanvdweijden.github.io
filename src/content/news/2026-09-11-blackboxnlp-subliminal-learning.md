---
title: "Subliminal learning reproduction accepted at BlackboxNLP 2026"
date: 2026-09-11
tag: publication
emphasis: "BlackboxNLP 2026"
draft: false
---

Our reproduction of the subliminal learning results from Cloud et al. was
accepted to the special track on Reproducibility and Reliability in
Interpretability Analyses at BlackboxNLP 2026, co-located with EMNLP in
Budapest.

Subliminal learning is the finding that a teacher model can pass a behavioral
trait to a student through data that never mentions it — number sequences, for
instance. We reproduced that on open-weight models and then pushed on how far it
generalises: new preference categories (actors and politicians), a new task
(chess moves instead of numbers), a third model family (Ministral8B), and an
ablation on how much room the teacher has to encode a preference. The effect
holds, but it is far from uniform — politicians transmit more strongly than
animals, chess more weakly than numbers, and Ministral barely at all.

The project was the fruit of our labor during our yearly retreat with the research group. The backdrop of Vitznau worked wonders, although the further we dove into the project the less I was paying attention to the surroundings and the more intriged I got by the findings we were producing. I'm hoping future retreats will be as productive and exciting as this one.

Looking forward to presenting at EMNLP!

[Read the paper](/pubs/2026-subliminal-learning-open-weight/).
Code is on [GitHub](https://github.com/daanvdweijden/subliminal-learning-blackboxnlp2026).
