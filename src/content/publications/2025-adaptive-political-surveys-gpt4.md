---
title: "Adaptive political surveys and GPT-4: Tackling the cold start problem with simulated user interactions"
authors:
  - Fynn Bachmann
  - Daan van der Weijden
  - Lucien Heitz
  - Cristina Sarasua
  - Abraham Bernstein
date: 2025-05-22
venue: "PLoS One"
venueShort: "PLOS ONE"
type: Journal article
file: 2025-adaptive-political-surveys-gpt4.pdf
links:
  doi: 10.1371/journal.pone.0322690
  pdf: https://arxiv.org/pdf/2503.09311
bibtex: |
  @article{bachmann2025adaptive,
    title={Adaptive political surveys and GPT-4: Tackling the cold start problem with simulated user interactions},
    author={Bachmann, Fynn and van der Weijden, Daan and Heitz, Lucien and Sarasua, Cristina and Bernstein, Abraham},
    journal={PLoS One},
    volume={20},
    number={5},
    pages={e0322690},
    year={2025},
    publisher={Public Library of Science},
    doi={10.1371/journal.pone.0322690}
  }
draft: false
---

Adaptive questionnaires dynamically select the next question for a survey
participant based on their previous answers. Due to digitalisation, they have
become a viable alternative to traditional surveys in application areas such as
political science. One limitation, however, is their dependency on data to train
the model for question selection. Often, such training data (i.e., user
interactions) are unavailable *a priori*. To address this problem, we (i) test
whether Large Language Models (LLM) can accurately generate such interaction data
and (ii) explore if these synthetic data can be used to pre-train the statistical
model of an adaptive political survey.
