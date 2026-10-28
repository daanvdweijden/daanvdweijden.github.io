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
summary: "When one AI model is trained on data made by another, it can pick up the teacher's hidden preferences, like a favourite animal or politician, even from plain number lists or chess moves. Repeating this on open models confirms the effect is real, but its strength depends on the preference, the task and the model."
keyFindings:
  - "Subliminal preference transmission can be dramatic: a Qwen2.5-7B student trained only on number sequences from a teacher primed to favour Trump named Trump in about 78% of answers, against about 0.06% for a student trained on data from an unprimed teacher."
  - "Subliminal learning does not occur in every model: Ministral8B showed essentially no transmission across all preference types and tasks, while Qwen2.5-7B showed a substantially larger effect than Gemma3-4B."
  - "Hidden preferences also transmit subliminally through chess move generation, not only through number sequences, though the effect through chess moves is generally weaker."
  - "Restricting the number task to fewer digits made subliminal transmission of animal preferences in Qwen2.5-7B stronger rather than weaker, contrary to expectation."
figure:
  src: papers/figures/2026-subliminal-learning-open-weight.png
  caption: "Figure 2 (top) from the paper: how strongly student models trained only on number sequences picked up a teacher's hidden preference for each animal, actor and politician, as a log-odds ratio against a student trained on data from an unprimed teacher. Qwen2.5-7B (left) shows strong transmission, Gemma3-4B (middle) weaker transmission, and Ministral8B (right) essentially none."
  alt: "A three-by-three grid of dot plots, with rows for animals, actors and politicians and columns for the Qwen, Gemma and Ministral models. Qwen's dots sit far right of zero, especially for politicians such as Trump; Ministral's dots all sit at zero."
file: 2026-subliminal-learning-open-weight.pdf
links:
  code: https://github.com/daanvdweijden/subliminal-learning-blackboxnlp2026
  url: https://aclanthology.org/2026.blackboxnlp-1.62/
  urlLabel: ACL Anthology
bibtex: |
  @inproceedings{van-der-weijden-etal-2026-reproducing,
    title = "Reproducing and Evaluating the Generalizability of Subliminal Learning in Open-Weight Models",
    author = "van der Weijden, Daan and Brack, Nathan and B{\'a}ez Santamar{\'i}a, Selene",
    editor = "Arad, Dana and Belinkov, Yonatan and Chen, Hanjie and Feldhus, Nils and Mueller, Aaron and Mohebbi, Hosein and Sarti, Gabriele and Tutek, Martin",
    booktitle = "Proceedings of the 9th {B}lackbox{NLP} Workshop: Analyzing and Interpreting Neural Networks for {NLP}",
    month = oct,
    year = "2026",
    address = "Budapest, Hungary",
    publisher = "Association for Computational Linguistics",
    url = "https://aclanthology.org/2026.blackboxnlp-1.62/",
    pages = "1113--1120",
    ISBN = "979-8-89176-476-7"
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
