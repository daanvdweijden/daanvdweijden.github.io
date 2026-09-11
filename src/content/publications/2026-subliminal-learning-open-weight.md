---
title: "Reproducing and Evaluating the Generalizability of Subliminal Learning in Open-Weight Models"
authors:
  - Daan van der Weijden
  - Nathan Brack
  - Selene Báez Santamaría
date: 2026-10-29
venue: "The Ninth Workshop on Analyzing and Interpreting Neural Networks for NLP (BlackboxNLP 2026), co-located with EMNLP 2026, Budapest, Hungary"
venueShort: "BlackboxNLP '26"
type: Workshop paper
note: "Special Track on Reproducibility and Reliability in Interpretability Analyses"
file: 2026-subliminal-learning-open-weight.pdf
links:
  code: https://github.com/daanvdweijden/subliminal-learning-blackboxnlp2026
bibtex: |
  @inproceedings{vanderweijden2026reproducing,
    title={Reproducing and Evaluating the Generalizability of Subliminal Learning in Open-Weight Models},
    author={van der Weijden, Daan and Brack, Nathan and B{\'a}ez Santamar{\'i}a, Selene},
    booktitle={The 9th BlackboxNLP Workshop Special Track: Reproducibility and Reliability in Interpretability Analyses},
    year={2026}
  }
draft: false
---

In this reproduction paper we investigate subliminal learning, a consequence of
distillation where teacher models transmit behavioral preference traits through
semantically unrelated data. The original paper explores two types of traits
(animal preferences and misalignment), three data modalities (number sequences,
code, and chain of thought), and several model families. We reproduce their
experiments and extend the setup along three axes: new preference categories
(actors and politicians), a new task (chess move generation), and an additional
open-weight model (Ministral8B). We also run a controlled ablation on the
numbers task's answer-space size (1-, 2-, and 3-digit sequences). We focus on
open-weight models with accessible checkpoints on HuggingFace, since the
original paper's GPT-4.x fine-tuning is no longer available. Our reproduction
supports the original paper's claims, but our extensions show they are not
universal as transmission strength varies across traits and tasks, and one model
shows almost no effect at all.
