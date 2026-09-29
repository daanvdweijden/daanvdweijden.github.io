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
summary: "GPT-4, asked to fill in Switzerland's Smartvote questionnaire as a member of each major party, answered close to how real candidates of those parties did. Training an adaptive survey on these simulated answers before any real users arrive clearly improved its predictions and recommendations for its first users."
keyFindings:
  - "When GPT-4 answered the 75-question Smartvote questionnaire as a member of one of eight Swiss parties, its answers were on average closer to that party's typical position than an average real candidate's (mean distance 0.165 vs 0.191), significantly so for six of the eight parties."
  - "Pre-training an adaptive political survey on GPT-4-generated answers raised initial candidate recommendation accuracy from 24.8% to 42.3% and cut the prediction error for unanswered questions (RMSE) from 0.420 to 0.327, for users answering 30 questions."
  - "The advantage of pre-training an adaptive survey on GPT-4 data is temporary: a survey trained from scratch caught up after between 85 and 895 real users, depending on how many questions each user answered."
  - "GPT-4's simulated party answers were less extreme and far less varied than those of real Swiss candidates, and even GPT-4's maximum temperature setting did not restore the diversity of views found within real parties."
figure:
  src: papers/figures/2025-adaptive-political-surveys-gpt4.png
  caption: "Figure 5 from the paper: simulated performance of an adaptive Smartvote survey as real users arrive, each answering 30 questions. A model pre-trained on GPT-4-generated voters (GPTvoters, red) starts much better than one trained from scratch (Coldstart, blue), both in prediction error for unanswered questions (A, RMSE) and in candidate recommendation accuracy (B, CRA). The model trained from scratch catches up after 175 and 485 users respectively."
  alt: "Two line charts against number of users. Left: RMSE, where the Coldstart line starts high and drops to meet the GPT-initialised lines. Right: CRA, where the Coldstart line starts low and rises to meet them."
file: 2025-adaptive-political-surveys-gpt4.pdf
links:
  doi: 10.1371/journal.pone.0322690
  arxiv: https://arxiv.org/abs/2503.09311
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
