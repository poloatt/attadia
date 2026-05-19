import React, { useState } from 'react';
import { Box, Collapse, Divider, Typography } from '@mui/material';
import { KeyboardArrowDown as ChevronDownIcon } from '@mui/icons-material';
import {
  propiedadDetailSectionListSx,
  propiedadDetailSectionHeaderSx,
  propiedadDetailSectionTitleSx,
  propiedadDetailSectionIconSx,
  propiedadDetailSectionChevronSx,
  propiedadDetailSectionBodySx,
  propiedadDetailSectionDividerSx,
} from './propiedadDetailStyles';

/**
 * Google Tasks–style expandable section list (single rounded container, hairline dividers).
 */
export default function PropiedadDetailSections({ sections = [] }) {
  const [expandedKey, setExpandedKey] = useState(
    () => sections.find((s) => s.defaultExpanded)?.key ?? sections[0]?.key ?? null,
  );

  const handleToggle = (key) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  if (!sections.length) return null;

  return (
    <Box sx={propiedadDetailSectionListSx}>
      {sections.map((section, idx) => {
        const key = section.key ?? idx;
        const expanded = expandedKey === key;
        const Icon = section.icon;
        const isLast = idx === sections.length - 1;

        return (
          <Box key={key}>
            <Box
              component="button"
              type="button"
              onClick={() => handleToggle(key)}
              aria-expanded={expanded}
              sx={propiedadDetailSectionHeaderSx}
            >
              {Icon ? <Icon sx={propiedadDetailSectionIconSx} /> : null}
              <Typography component="span" sx={propiedadDetailSectionTitleSx}>
                {section.title}
              </Typography>
              <ChevronDownIcon sx={propiedadDetailSectionChevronSx(expanded)} />
            </Box>
            <Collapse in={expanded} timeout="auto" unmountOnExit={false}>
              <Box sx={propiedadDetailSectionBodySx}>{section.children}</Box>
            </Collapse>
            {!isLast ? <Divider sx={propiedadDetailSectionDividerSx} /> : null}
          </Box>
        );
      })}
    </Box>
  );
}
