---
title: "Subliminal learning reproduction accepted at BlackboxNLP 2026"
date: 2026-09-11
tag: publication
emphasis: "BlackboxNLP 2026"
draft: true
---

Our reproduction of the subliminal learning results from Cloud et al. was
accepted to the special track on Reproducibility and Reliability in
Interpretability Analyses at BlackboxNLP 2026, co-located with EMNLP in
Budapest.

<!-- TODO: how the project started, what surprised you (Ministral showing
essentially no effect?), who did what. Photos go in public/news/ — see the
README in this folder. -->

Subliminal learning is the finding that a teacher model can pass a behavioral
trait to a student through data that never mentions it — number sequences, for
instance. We reproduced that on open-weight models, since the GPT-4.x
fine-tuning API the original work used is gone, and then pushed on how far it
generalises: new preference categories (actors and politicians), a new task
(chess moves instead of numbers), a third model family (Ministral8B), and an
ablation on how much room the teacher has to encode a preference. The effect
holds, but it is far from uniform — politicians transmit more strongly than
animals, chess more weakly than numbers, and Ministral barely at all.

[Read the paper](/pubs/2026-subliminal-learning-open-weight/).
Code is on [GitHub](https://github.com/daanvdweijden/subliminal-learning-blackboxnlp2026).
