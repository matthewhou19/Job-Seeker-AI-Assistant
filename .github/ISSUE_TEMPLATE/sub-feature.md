name: Sub-Feature
description: Track a sub-feature or requirement that belongs to a larger feature
title: "[Sub-Feature] "
labels: [sub-feature]
body:
  - type: markdown
    attributes:
      value: |
        ## 🎯 Objective
        What specifically should this sub-feature deliver?
  - type: textarea
    id: objective
    attributes:
      label: Objective
  - type: markdown
    attributes:
      value: |
        ## 🔗 References
        - Parent Feature: #
        - Blocks: #
        - Blocked by: #
        - Related: #
  - type: markdown
    attributes:
      value: |
        ## ✅ Acceptance Criteria
        - [ ] Clear condition 1
        - [ ] Clear condition 2
        - [ ] Clear condition 3
  - type: textarea
    id: context
    attributes:
      label: Context
      description: Any design links, API docs, notes, etc.
