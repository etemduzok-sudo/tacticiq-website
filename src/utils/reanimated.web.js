// Web için react-native-reanimated mock
// Bu dosya web platformunda react-native-reanimated yerine kullanılır

const { Animated } = require('react-native');

// Mock Animated component
const MockAnimated = {
  View: Animated.View,
  Text: Animated.Text,
  Image: Animated.Image,
  ScrollView: Animated.ScrollView,
  FlatList: Animated.FlatList,
  SectionList: Animated.SectionList,
  createAnimatedComponent: (component) => component,
};

// Mock hooks - no-op functions
const useSharedValue = (initialValue) => ({ value: initialValue });
const useAnimatedStyle = () => ({});
const useAnimatedProps = () => ({});
const useDerivedValue = (fn) => ({ value: fn() });
const useAnimatedReaction = () => {};
const useAnimatedGestureHandler = () => {};
const useAnimatedScrollHandler = () => {};

// Mock animations - no-op
const withTiming = (toValue, config) => toValue;
const withSpring = (toValue, config) => toValue;
const withRepeat = (animation, iterations, reverse) => animation;
const withSequence = (...animations) => animations[0];
const withDelay = (delay, animation) => animation;
const withDecay = (config) => 0;
const cancelAnimation = () => {};
const runOnJS = (fn) => fn;
const runOnUI = (fn) => fn;

// Mock entering/exiting animations
const FadeIn = { duration: () => ({}) };
const FadeOut = { duration: () => ({}) };
const FadeInDown = { duration: () => ({}) };
const FadeInUp = { duration: () => ({}) };
const FadeInLeft = { duration: () => ({}) };
const FadeInRight = { duration: () => ({}) };
const SlideInRight = { duration: () => ({}) };
const SlideInLeft = { duration: () => ({}) };
const SlideOutRight = { duration: () => ({}) };
const SlideOutLeft = { duration: () => ({}) };
const ZoomIn = { duration: () => ({}) };
const ZoomOut = { duration: () => ({}) };
const Layout = { duration: () => ({}) };

// Mock Easing
const Easing = {
  linear: () => {},
  ease: () => {},
  quad: () => {},
  cubic: () => {},
  poly: () => {},
  sin: () => {},
  circle: () => {},
  exp: () => {},
  elastic: () => {},
  back: () => {},
  bounce: () => {},
  bezier: () => {},
  in: () => {},
  out: () => {},
  inOut: () => {},
};

// CommonJS exports
module.exports = MockAnimated;
module.exports.useSharedValue = useSharedValue;
module.exports.useAnimatedStyle = useAnimatedStyle;
module.exports.useAnimatedProps = useAnimatedProps;
module.exports.useDerivedValue = useDerivedValue;
module.exports.useAnimatedReaction = useAnimatedReaction;
module.exports.useAnimatedGestureHandler = useAnimatedGestureHandler;
module.exports.useAnimatedScrollHandler = useAnimatedScrollHandler;
module.exports.withTiming = withTiming;
module.exports.withSpring = withSpring;
module.exports.withRepeat = withRepeat;
module.exports.withSequence = withSequence;
module.exports.withDelay = withDelay;
module.exports.withDecay = withDecay;
module.exports.cancelAnimation = cancelAnimation;
module.exports.runOnJS = runOnJS;
module.exports.runOnUI = runOnUI;
module.exports.FadeIn = FadeIn;
module.exports.FadeOut = FadeOut;
module.exports.FadeInDown = FadeInDown;
module.exports.FadeInUp = FadeInUp;
module.exports.FadeInLeft = FadeInLeft;
module.exports.FadeInRight = FadeInRight;
module.exports.SlideInRight = SlideInRight;
module.exports.SlideInLeft = SlideInLeft;
module.exports.SlideOutRight = SlideOutRight;
module.exports.SlideOutLeft = SlideOutLeft;
module.exports.ZoomIn = ZoomIn;
module.exports.ZoomOut = ZoomOut;
module.exports.Layout = Layout;
module.exports.Easing = Easing;
