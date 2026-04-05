import React from 'react';
import { View } from 'react-native';
import SvgXml from 'react-native-svg';
import { parse } from 'fast-xml-parser';

function isSafeSvg(svg) {
  if (typeof svg !== 'string') {
    return false;
  }

  const trimmed = svg.trim();
  if (!trimmed.startsWith('<svg')) {
    return false;
  }

  return !/(<script|on\w+=|javascript:|data:text\/html)/i.test(trimmed);
}

export function SvgPreview({ svg, width = '100%', height = 240, fallback = null, style }) {
  if (!isSafeSvg(svg)) {
    return fallback ? <View style={style}>{fallback}</View> : null;
  }

  const sanitized = svg.trim();
  try {
    parse(sanitized);
  } catch (error) {
    return fallback ? <View style={style}>{fallback}</View> : null;
  }

  return (
    <View style={style}>
      <SvgXml xml={sanitized} width={width} height={height} />
    </View>
  );
}

export default SvgPreview;