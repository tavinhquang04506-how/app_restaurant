import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../stores/useThemeStore';
import { useLanguageStore, translateDbText } from '../stores/useLanguageStore';
import { FoodImage } from './FoodImage';
import { StarRating } from './StarRating';
import { formatVnd } from '../utils/CurrencyFormat';
import type { FoodModel } from '../models/FoodModels';
import * as Api from '../repositories/ApiRepository';

interface FoodDetailModalProps {
  visible: boolean;
  onClose: () => void;
  food: FoodModel | null;
  isLoggedIn: boolean;
  favoriteIds: string[];
  onToggleFavorite: (foodId: string, willBeFavorite: boolean) => void;
  onAddToCart: (food: FoodModel) => void;
}

interface RatingItem {
  id: string;
  username: string;
  comment: string;
  rating: number;
  createdAt: string;
}

export function FoodDetailModal({
  visible,
  onClose,
  food,
  isLoggedIn,
  favoriteIds,
  onToggleFavorite,
  onAddToCart,
}: FoodDetailModalProps) {
  const { colors, isDarkMode } = useThemeStore();
  const { t, language } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');
  const [ratings, setRatings] = useState<RatingItem[]>([]);
  const [loadingRatings, setLoadingRatings] = useState(false);

  // Sync state for immediate favorite toggle
  const isFav = food ? favoriteIds.includes(food.id) : false;

  useEffect(() => {
    if (visible && food) {
      setActiveTab('info');
      setLoadingRatings(true);
      Api.getFoodRatings(food.id)
        .then((res) => {
          if (res && res.data) {
            setRatings(res.data);
          } else {
            setRatings([]);
          }
        })
        .catch(() => setRatings([]))
        .finally(() => setLoadingRatings(false));
    }
  }, [visible, food]);

  if (!food) return null;

  // Generate dynamic ingredients & taste
  const getFoodDetails = (name: string) => {
    const lower = name.toLowerCase();
    const isEn = language === 'en';

    if (lower.includes('vịt quay') || lower.includes('peking duck')) {
      return {
        ingredients: isEn 
          ? 'Premium Beijing duck, duck pancake wraps, cucumber sticks, scallion threads, authentic sweet bean sauce, traditional Chinese spices.'
          : 'Thịt vịt Bắc Kinh hảo hạng, bánh tráng bọc vịt, dưa leo cắt sợi, hành lá bào mỏng, nước xốt tương ngọt đặc trưng, gia vị thảo mộc bí truyền.',
        taste: isEn
          ? 'Crispy caramelized skin, tender succulent meat, perfectly balanced sweetness and rich aromatic flavors.'
          : 'Lớp da giòn rụm màu bánh mật, thịt ngọt mềm mọng nước ăn kèm bánh tráng dẻo dai và nước sốt tương ngọt đậm đà vị thảo mộc.',
      };
    } else if (lower.includes('đậu hũ ma bà') || lower.includes('mapo tofu') || lower.includes('đậu phụ')) {
      return {
        ingredients: isEn
          ? 'Silken tofu, premium minced beef, Sichuan red chili oil, Sichuan peppercorns, fermented broad bean paste (pixian doubanjiang), garlic, scallions.'
          : 'Đậu hũ non mềm mịn, thịt bò băm hảo hạng, dầu ớt Tứ Xuyên, tiêu Tứ Xuyên tê cay, tương hạt bản xứ, tỏi, hành lá.',
        taste: isEn
          ? 'Intensely spicy and numbing (mala), deeply savory and piping hot, satisfyingly comforting.'
          : 'Vị tê cay đậm đà đặc trưng (Ma-Lạt) từ tiêu Tứ Xuyên, nước xốt sền sệt béo ngậy quyện cùng thịt băm đậm vị.',
      };
    } else if (lower.includes('thịt kho đông pha') || lower.includes('dongpo pork') || lower.includes('thịt kho')) {
      return {
        ingredients: isEn
          ? 'Strictly selected pork belly, Shaoxing rice wine, dark soy sauce, rock sugar, fresh ginger, spring onions, star anise.'
          : 'Thịt ba chỉ heo tuyển chọn, rượu gạo Thiệu Hưng, nước tương hảo hạng, đường phèn, gừng tươi, hành lá, hoa hồi.',
        taste: isEn
          ? 'Incredibly rich and savory-sweet, melt-in-your-mouth tenderness without feeling overly greasy.'
          : 'Vị mặn ngọt hài hòa, béo ngậy mà không ngấy, lớp mỡ và thịt hầm nhừ mềm mại tan chảy ngay trên đầu lưỡi.',
      };
    } else if (lower.includes('sủi cảo') || lower.includes('dumpling') || lower.includes('há cảo triều châu') || lower.includes('chaozhou')) {
      return {
        ingredients: isEn
          ? 'Fresh whole shrimps, minced pork, garlic chives, minced ginger, light soy sauce, sesame oil, thin dumpling wrappers.'
          : 'Tôm tươi nguyên con, thịt heo băm, hẹ tươi, gừng băm, nước tương, dầu mè, vỏ sủi cảo/há cảo mỏng dai.',
        taste: isEn
          ? 'Delicately juicy, sweet natural shrimp flavor, wrapped in a satisfyingly chewy and smooth pastry.'
          : 'Nhân tôm ngọt tự nhiên, thịt heo đậm đà mọng nước bọc trong vỏ bánh mỏng dai trong suốt chấm xì dầu giấm đỏ tuyệt hảo.',
      };
    } else if (lower.includes('mì vịt tiềm') || lower.includes('braised duck')) {
      return {
        ingredients: isEn
          ? 'Egg noodles, braised duck drumstick, star anise, cinnamon, goji berries, dong quai, shiitake mushrooms, baby bok choy.'
          : 'Mì trứng sợi dai, đùi vịt chiên giòn, hoa hồi, thanh quế, kỷ tử, đương quy, nấm đông cô, cải thìa tươi.',
        taste: isEn
          ? 'Rich herbal broth filled with deep comforting aroma, combined with crispy-skinned yet tender duck.'
          : 'Nước dùng ngọt thanh đậm đà thơm lừng thảo mộc thuốc bắc, đùi vịt da giòn thịt mềm tơi hòa quyện cùng mì trứng dai ngon.',
      };
    } else if (lower.includes('dương châu') || lower.includes('yangzhou') || lower.includes('cơm chiên')) {
      return {
        ingredients: isEn
          ? 'Fluffy jasmine rice, sweet lap cheong (Chinese sausage), fresh shrimp, green peas, carrots, sweet corn, eggs, soy sauce.'
          : 'Cơm gạo tám thơm tơi xốp, lạp xưởng ngọt thơm, tôm tươi, đậu Hà Lan, cà rốt, ngô ngọt, trứng gà ta, nước tương.',
        taste: isEn
          ? 'Lightly savory and highly aromatic, filled with colorful textures of fresh ingredients.'
          : 'Hương vị thơm bùi đặc trưng của hạt cơm săn giòn vàng óng quyện với lạp xưởng, tôm thịt ngọt mát.',
      };
    } else if (lower.includes('lẩu tứ xuyên') || lower.includes('sichuan hotpot')) {
      return {
        ingredients: isEn
          ? 'Twin-flavor hotpot broth (spicy Sichuan broth with chilies & herbs, mild healing mushroom chicken broth), beef slices, meatballs, mushrooms, assorted veggies.'
          : 'Nước dùng lẩu hai ngăn (một bên ớt tiêu cay nồng Tứ Xuyên, một bên gà hầm nấm thảo mộc ngọt thanh), ba chỉ bò, viên thả lẩu, nấm tươi, rau xanh.',
        taste: isEn
          ? 'Dynamic dual experience: intensely fiery-numbing on one side, and soothingly deep-savory on the other.'
          : 'Trải nghiệm ẩm thực kép độc đáo: một bên cay tê kích thích vị giác cực độ, một bên thanh mát bổ dưỡng từ nấm thảo mộc.',
      };
    } else if (lower.includes('tart trứng') || lower.includes('egg tart')) {
      return {
        ingredients: isEn
          ? 'Crispy multi-layer puff pastry, fresh eggs, whipping cream, fresh milk, pure vanilla extract, refined sugar.'
          : 'Bột bánh ngàn lớp giòn tan, trứng gà tươi, kem tươi whipping cream, sữa tươi nguyên chất, tinh chất vanilla Pháp, đường phèn.',
        taste: isEn
          ? 'Ultra-flaky pastry holding a velvety, smooth, and richly creamy warm custard center.'
          : 'Vỏ bánh nướng giòn tan xếp nhiều lớp mỏng bọc lấy phần nhân kem trứng vàng óng béo ngậy, ngọt ngào lan tỏa.',
      };
    } else if (lower.includes('mè đen') || lower.includes('sesame') || lower.includes('chè trôi')) {
      return {
        ingredients: isEn
          ? 'Premium black sesame seeds, glutinous rice flour, brown ginger sugar syrup, fresh ginger root, roasted white sesame.'
          : 'Hạt mè đen thượng hạng, bột gạo nếp dẻo thơm, nước đường phên gừng ấm nồng, gừng tươi giã dập, mè trắng rang.',
        taste: isEn
          ? 'Wonderfully chewy rice balls stuffed with nutty black sesame paste in a warm, spicy-sweet ginger soup.'
          : 'Viên chè trôi nước dẻo dai bùi béo nhân mè đen thơm ngọt ngào hòa quyện cùng nước gừng nóng ấm cay nhẹ.',
      };
    } else if (lower.includes('kim sa') || lower.includes('custard bun') || lower.includes('bánh bao')) {
      return {
        ingredients: isEn
          ? 'Salted egg yolks, butter, condensed milk, custard powder, wheat flour, active yeast, fresh milk.'
          : 'Lòng đỏ trứng muối chín vàng, bơ lạt, sữa đặc, bột custard, bột mì đa dụng, men nở, sữa tươi không đường.',
        taste: isEn
          ? 'Fluffy cloud-like steamed bun with an explosive, sweet and salty molten custard filling.'
          : 'Vỏ bánh bao xốp mềm nóng hổi ôm trọn lớp nhân trứng muối sữa béo ngậy chảy tuôn tràn đầy kích thích.',
      };
    } else if (lower.includes('quy linh') || lower.includes('guilinggao') || lower.includes('thạch')) {
      return {
        ingredients: isEn
          ? 'Guilinggao herbal powder, wild honey, sweet condensed milk, spring water.'
          : 'Bột thảo mộc Quy Linh Cao cổ truyền, mật ong rừng nguyên chất, sữa đặc có đường, nước khoáng tinh khiết.',
        taste: isEn
          ? 'Firm silky herbal jelly, pleasantly bitter undertones beautifully balanced by sweet fragrant honey.'
          : 'Thạch quy linh đen bóng mát rượi, vị đắng nhẹ thảo mộc quyện hòa cùng mật ong rừng ngọt ngào thanh khiết.',
      };
    } else if (lower.includes('vương lão cát') || lower.includes('wong lo kat') || lower.includes('thảo mộc')) {
      return {
        ingredients: isEn
          ? 'Water, sugar, extracts of 10 herbal ingredients (chrysanthemum, honeysuckle, licorice, selfheal, etc.).'
          : 'Nước tinh khiết, đường phèn, chiết xuất từ 10 loại thảo mộc Trung Hoa quý hiếm (hoa cúc, kim ngân hoa, cam thảo, hạ khô thảo,...).',
        taste: isEn
          ? 'Refreshing, mildly sweet herbal tea with a soothing, cooling herbal finish.'
          : 'Vị trà thảo mộc ngọt thanh tự nhiên, cực kỳ giải khát và giúp thanh nhiệt cơ thể tức thì sau khi thưởng thức đồ cay.',
      };
    } else if (lower.includes('coca') || lower.includes('pepsi')) {
      return {
        ingredients: isEn
          ? 'Carbonated purified water, high fructose corn syrup, caramel color, phosphoric acid, natural flavors, caffeine.'
          : 'Nước bão hòa CO2, đường mía mía tinh khiết, màu caramel tự nhiên, chất điều chỉnh độ acid, hương tự nhiên, caffeine.',
        taste: isEn
          ? 'Crisp, sweet, and intensely bubbly, best served ice-cold to elevate your dining pleasure.'
          : 'Vị gas cực mạnh bùng nổ, ngọt ngào sảng khoái kích thích tiêu hóa tuyệt hảo khi dùng kèm các món ăn nóng hổi.',
      };
    } else if (lower.includes('aquafina') || lower.includes('nước lọc')) {
      return {
        ingredients: isEn
          ? '100% pure drinking water processed through state-of-the-art Hydro-7 purification system.'
          : '100% nước uống tinh khiết Aquafina được lọc qua hệ thống Hydro-7 lọc siêu vi độc quyền.',
        taste: isEn
          ? 'Incredibly clean, crisp, and pure taste that keeps you hydrated throughout your meal.'
          : 'Vị nước lọc tinh khiết, mát lành tự nhiên, giúp làm sạch khoang miệng và cân bằng vị giác trong bữa ăn.',
      };
    } else if (lower.includes('hoa cúc') || lower.includes('chrysanthemum')) {
      return {
        ingredients: isEn
          ? 'Dried yellow chrysanthemum buds, wild forest honey, rock sugar, hot spring water.'
          : 'Hoa cúc vàng sấy khô nguyên bông, mật ong rừng tự nhiên, đường phèn Quảng Ngãi, nước nóng tinh khiết.',
        taste: isEn
          ? 'Gentle floral scent with a delicate honey sweetness, highly calming and refreshing.'
          : 'Mùi thơm hoa cúc dịu nhẹ ấm áp quyện cùng vị ngọt thanh thanh của mật ong rừng, thanh tao thư giãn.',
      };
    } else if (lower.includes('phật nhảy tường') || lower.includes('buddha jumps')) {
      return {
        ingredients: isEn
          ? 'Abalone, sea cucumber, shark fin, dried scallops, shiitake mushrooms, chicken breast, pork tendon, goji berries, traditional Chinese herbs.'
          : 'Bào ngư, hải sâm, vi cá, sò điệp khô, nấm đông cô, thịt gà, gân heo, kỷ tử, các loại thảo mộc bổ dưỡng.',
        taste: isEn
          ? 'Incredibly rich and complex, layers of umami from premium seafood slow-braised in a luxurious herbal broth.'
          : 'Hương vị cực kỳ đậm đà phức hợp, nhiều lớp umami từ hải sản thượng hạng hầm nhừ trong nước dùng thảo mộc quý.',
      };
    } else if (lower.includes('nhất phẩm tay cầm') || lower.includes('premium abalone')) {
      return {
        ingredients: isEn
          ? 'Fresh abalone, reishi mushrooms, premium seafood stock, ginger, scallions, oyster sauce, clay pot.'
          : 'Bào ngư tươi, nấm linh chi, nước dùng hải sản hảo hạng, gừng, hành lá, dầu hào, nồi đất.',
        taste: isEn
          ? 'Tender abalone in a deeply savory, earthy mushroom broth with subtle medicinal warmth.'
          : 'Bào ngư mềm mại trong nước dùng nấm đậm đà, hương thảo mộc ấm áp tinh tế.',
      };
    } else if (lower.includes('heo sữa quay') || lower.includes('suckling pig')) {
      return {
        ingredients: isEn
          ? 'Whole suckling pig, five-spice powder, maltose syrup, rice vinegar, lemongrass, special dipping sauce.'
          : 'Heo sữa nguyên con, ngũ vị hương, mạch nha, giấm gạo, sả tươi, nước chấm đặc biệt.',
        taste: isEn
          ? 'Impossibly crispy golden skin, naturally sweet tender meat, served with aromatic special sauce.'
          : 'Da giòn vàng rượm bất khả tư nghì, thịt mềm ngọt tự nhiên, phục vụ kèm nước chấm thơm đặc biệt.',
      };
    } else if (lower.includes('xá xíu mật ong') || lower.includes('char siu') || lower.includes('honey char')) {
      return {
        ingredients: isEn
          ? 'Premium pork loin, wildflower honey, five-spice powder, hoisin sauce, soy sauce, red fermented bean curd, charcoal grill.'
          : 'Thịt thăn heo hảo hạng, mật ong hoa rừng, ngũ vị hương, tương hoisin, nước tương, chao đỏ, nướng than hoa.',
        taste: isEn
          ? 'Caramelized honey glaze, smoky charcoal aroma, perfectly balanced savory-sweet meat.'
          : 'Lớp men mật ong caramel hóa, hương khói than hoa, thịt mặn ngọt cân bằng hoàn hảo.',
      };
    } else if (lower.includes('gà hấp muối') || lower.includes('salt-baked chicken') || lower.includes('salt baked')) {
      return {
        ingredients: isEn
          ? 'Free-range whole chicken, coarse sea salt, Sichuan peppercorns, star anise, sand ginger powder, salt-pepper-lime dip.'
          : 'Gà ta nguyên con, muối hột biển, tiêu Tứ Xuyên, hoa hồi, bột riềng, muối tiêu chanh.',
        taste: isEn
          ? 'Silky smooth skin, incredibly juicy and tender meat infused with aromatic salt and spice.'
          : 'Da vàng bóng mịn, thịt cực kỳ mọng nước mềm ngọt thấm đẫm muối hột và gia vị thơm.',
      };
    } else if (lower.includes('bồ câu hồng xíu') || lower.includes('braised pigeon')) {
      return {
        ingredients: isEn
          ? 'Young pigeon, soy sauce, rock sugar, ginger, star anise, cinnamon bark, Shaoxing wine.'
          : 'Bồ câu non, nước tương, đường phèn, gừng, hoa hồi, thanh quế, rượu Thiệu Hưng.',
        taste: isEn
          ? 'Melt-in-your-mouth tender, sweet-savory braising sauce with rich poultry depth.'
          : 'Thịt mềm tan trong miệng, nước sốt hồng xíu mặn ngọt đậm đà vị gia cầm.',
      };
    } else if (lower.includes('heo quay da giòn') || lower.includes('crispy roasted pork')) {
      return {
        ingredients: isEn
          ? 'Pork belly, five-spice powder, white vinegar, coarse salt, garlic, sweet chili dipping sauce.'
          : 'Thịt ba chỉ heo, ngũ vị hương, giấm trắng, muối hột, tỏi, nước mắm chua ngọt.',
        taste: isEn
          ? 'Shatteringly crispy crackling skin, juicy tender meat underneath, addictive contrasting textures.'
          : 'Da phồng rộp giòn tan, thịt bên trong mềm mọng nước, kết cấu tương phản gây nghiện.',
      };
    } else if (lower.includes('phá lấu') || lower.includes('chaozhou braised')) {
      return {
        ingredients: isEn
          ? 'Assorted offal (tripe, intestines, tongue), five-spice braising liquid, star anise, cinnamon, soy sauce, rock sugar.'
          : 'Tổng hợp nội tạng (dạ dày, ruột, lưỡi), nước hầm ngũ vị hương, hoa hồi, thanh quế, nước tương, đường phèn.',
        taste: isEn
          ? 'Rich, aromatic five-spice braised flavors, tender and chewy textures in every bite.'
          : 'Hương vị ngũ vị hương đậm đà, kết cấu mềm dai phong phú trong từng miếng.',
      };
    } else if (lower.includes('tôm hùm hấp') || lower.includes('garlic steamed lobster')) {
      return {
        ingredients: isEn
          ? 'Live Alaska lobster, fresh garlic, glass noodles, premium soy sauce, scallion oil, steamer.'
          : 'Tôm hùm Alaska tươi sống, tỏi tươi băm, miến dong, nước tương hảo hạng, dầu hành.',
        taste: isEn
          ? 'Sweet, succulent lobster meat infused with aromatic garlic, served on a bed of silky glass noodles.'
          : 'Thịt tôm hùm ngọt lịm mọng nước thấm hương tỏi thơm, phục vụ trên lớp miến dong mềm.',
      };
    } else if (lower.includes('tôm càng rang') || lower.includes('salt & pepper') || lower.includes('salt pepper')) {
      return {
        ingredients: isEn
          ? 'Fresh river prawns, coarse salt, crushed peppercorns, chili flakes, garlic, fried shallots.'
          : 'Tôm càng xanh tươi, muối hột, tiêu đập dập, ớt bột, tỏi phi, hành phi.',
        taste: isEn
          ? 'Crispy shell, sweet firm prawn meat, irresistible salty-peppery-garlicky crunch.'
          : 'Vỏ giòn rụm, thịt tôm ngọt chắc, vị muối tiêu tỏi giòn tan khó cưỡng.',
      };
    } else if (lower.includes('cơm chiên hải sản') || lower.includes('seafood fried rice')) {
      return {
        ingredients: isEn
          ? 'Jasmine rice, shrimp, squid, scallops, eggs, mixed vegetables, soy sauce, sesame oil.'
          : 'Cơm gạo thơm, tôm, mực, sò điệp, trứng, rau củ tổng hợp, nước tương, dầu mè.',
        taste: isEn
          ? 'Aromatic wok-fried rice with bouncy seafood, each grain perfectly separated and flavorful.'
          : 'Cơm chiên thơm lừng hương lửa wok với hải sản tươi giòn, từng hạt cơm tơi rời đậm vị.',
      };
    } else if (lower.includes('mì xào hải sản') || lower.includes('seafood stir-fried noodle')) {
      return {
        ingredients: isEn
          ? 'Egg noodles, shrimp, squid, clams, bok choy, oyster sauce, garlic, ginger.'
          : 'Mì trứng, tôm, mực, nghêu, cải thìa, dầu hào, tỏi, gừng.',
        taste: isEn
          ? 'Savory wok-charred noodles tossed with fresh seafood in rich oyster sauce.'
          : 'Mì cháy cạnh thơm lửa xào cùng hải sản tươi trong dầu hào béo ngậy.',
      };
    } else if (lower.includes('hủ tíu xào bò') || lower.includes('beef ho fun') || lower.includes('hủ tiếu')) {
      return {
        ingredients: isEn
          ? 'Wide rice noodles (ho fun), tender beef slices, bean sprouts, chives, dark soy sauce, wok hei.'
          : 'Hủ tiếu bản to, thịt bò thái lát mềm, giá đỗ, hẹ, nước tương đen, lửa wok.',
        taste: isEn
          ? 'Silky rice noodles with smoky wok breath, tender beef, and savory soy sauce depth.'
          : 'Hủ tiếu mềm mịn thấm hương khói bếp, thịt bò mềm thơm, nước tương đen đậm đà.',
      };
    } else if (lower.includes('cơm chiên bò') || lower.includes('beef fried rice')) {
      return {
        ingredients: isEn
          ? 'Jasmine rice, marinated beef strips, eggs, scallions, soy sauce, black pepper.'
          : 'Cơm gạo thơm, thịt bò xào mềm, trứng, hành lá, nước tương, tiêu đen.',
        taste: isEn
          ? 'Fragrant fried rice with tender savory beef, perfectly seasoned with soy and pepper.'
          : 'Cơm chiên thơm lừng với thịt bò mềm mặn, nêm hoàn hảo với nước tương và tiêu.',
      };
    } else if (lower.includes('đậu hũ tứ xuyên chay') || lower.includes('vegetarian sichuan')) {
      return {
        ingredients: isEn
          ? 'Silken tofu, minced shiitake mushrooms, Sichuan chili oil, peppercorns, fermented bean paste, garlic, scallions.'
          : 'Đậu hũ non, nấm đông cô xay, dầu ớt Tứ Xuyên, tiêu Tứ Xuyên, tương đậu, tỏi, hành lá.',
        taste: isEn
          ? 'All the fiery mala flavor of classic Mapo Tofu, made entirely plant-based and deeply satisfying.'
          : 'Trọn vẹn hương vị tê cay Ma-Lạt kinh điển, hoàn toàn từ thực vật và thỏa mãn tuyệt vời.',
      };
    } else if (lower.includes('gỏi nấm mèo') || lower.includes('wood ear mushroom salad')) {
      return {
        ingredients: isEn
          ? 'Black wood ear mushrooms, Chinkiang vinegar, chili oil, garlic, cilantro, sesame seeds.'
          : 'Nấm mèo đen, giấm đen Trấn Giang, dầu ớt, tỏi, rau mùi, mè rang.',
        taste: isEn
          ? 'Cool, crunchy, tangy, and spicy — a refreshing appetizer that awakens the palate.'
          : 'Mát lạnh, giòn sần sật, chua cay — món khai vị sảng khoái đánh thức vị giác.',
      };
    } else if (lower.includes('khoai tây sợi') || lower.includes('shredded potato')) {
      return {
        ingredients: isEn
          ? 'Potatoes julienned thin, dried chili, Sichuan peppercorns, rice vinegar, garlic, scallions.'
          : 'Khoai tây thái sợi mỏng, ớt khô, tiêu Tứ Xuyên, giấm gạo, tỏi, hành lá.',
        taste: isEn
          ? 'Crispy-crunchy potato shreds with a vibrant sour-spicy kick, addictively simple.'
          : 'Sợi khoai tây giòn sần sật với vị chua cay rực rỡ, đơn giản nhưng gây nghiện.',
      };
    } else if (lower.includes('chè hạnh nhân') || lower.includes('almond cream')) {
      return {
        ingredients: isEn
          ? 'Southern almonds (apricot kernels), rock sugar, fresh milk, egg whites.'
          : 'Hạnh nhân nam, đường phèn, sữa tươi, lòng trắng trứng.',
        taste: isEn
          ? 'Silky smooth almond cream, gently sweet and fragrant, soothing and nourishing.'
          : 'Chè hạnh nhân mịn như nhung, ngọt nhẹ thơm lừng, thanh mát bổ dưỡng.',
      };
    } else if (lower.includes('bánh bò nướng') || lower.includes('honeycomb cake')) {
      return {
        ingredients: isEn
          ? 'Rice flour, tapioca starch, coconut milk, pandan leaves, sugar, yeast.'
          : 'Bột gạo, bột năng, nước cốt dừa, lá dứa, đường, men nở.',
        taste: isEn
          ? 'Soft spongy layers with a delicate pandan-coconut aroma, slightly chewy texture.'
          : 'Nhiều lớp xốp mềm với hương lá dứa dừa dịu nhẹ, kết cấu hơi dẻo dai.',
      };
    } else if (lower.includes('xoài sago') || lower.includes('mango pomelo')) {
      return {
        ingredients: isEn
          ? 'Ripe mangoes, sago pearls, coconut milk, pomelo flesh, condensed milk.'
          : 'Xoài chín, hạt sago, nước cốt dừa, tép bưởi, sữa đặc.',
        taste: isEn
          ? 'Luscious mango sweetness with chewy sago and creamy coconut, tropical perfection.'
          : 'Vị xoài ngọt lịm với sago dẻo mềm và dừa béo ngậy, hoàn hảo nhiệt đới.',
      };
    } else if (lower.includes('đậu đỏ trần bì') || lower.includes('red bean soup')) {
      return {
        ingredients: isEn
          ? 'Red adzuki beans, aged orange peel (30 years), mini glutinous rice balls, rock sugar.'
          : 'Đậu đỏ, trần bì 30 năm tuổi, viên nếp nhỏ, đường phèn.',
        taste: isEn
          ? 'Warm, comforting red bean soup with citrusy aged peel and chewy rice balls.'
          : 'Chè đậu đỏ ấm áp an ủi với trần bì thơm cam và viên nếp dẻo dai.',
      };
    } else if (lower.includes('thạch hoa cúc kỷ tử') || lower.includes('chrysanthemum jelly goji')) {
      return {
        ingredients: isEn
          ? 'Fresh chrysanthemum flowers, goji berries, longan, agar-agar, rock sugar.'
          : 'Hoa cúc tươi, hạt kỷ tử, nhãn nhục, rau câu, đường phèn.',
        taste: isEn
          ? 'Crystal-clear floral jelly, cooling and lightly sweet with nutritious goji berries.'
          : 'Thạch trong suốt hương hoa, thanh mát ngọt nhẹ với kỷ tử bổ dưỡng.',
      };
    } else if (lower.includes('rau câu dừa') || lower.includes('pandan coconut jelly')) {
      return {
        ingredients: isEn
          ? 'Coconut milk, pandan leaves, agar-agar, sugar, vanilla.'
          : 'Nước cốt dừa, lá dứa, rau câu, đường, vani.',
        taste: isEn
          ? 'Multi-layered green and white jelly, fragrant pandan meets creamy coconut.'
          : 'Rau câu nhiều lớp xanh trắng, hương lá dứa hòa quyện dừa béo.',
      };
    } else if (lower.includes('mochi') || lower.includes('mochi đậu đỏ')) {
      return {
        ingredients: isEn
          ? 'Glutinous rice flour, sweet red bean paste, potato starch, sugar.'
          : 'Bột gạo nếp, nhân đậu đỏ ngọt, bột khoai tây, đường.',
        taste: isEn
          ? 'Pillowy soft mochi skin encasing sweet, earthy red bean filling.'
          : 'Vỏ mochi dẻo mềm như gối bọc nhân đậu đỏ ngọt bùi.',
      };
    } else if (lower.includes('trái cây thượng hạng') || lower.includes('fruit platter') || lower.includes('seasonal fruit')) {
      return {
        ingredients: isEn
          ? 'Dragon fruit, mango, watermelon, grapes, strawberries — seasonal premium selection.'
          : 'Thanh long, xoài, dưa hấu, nho, dâu tây — tuyển chọn theo mùa thượng hạng.',
        taste: isEn
          ? 'A refreshing medley of nature\'s finest fruits, beautifully presented.'
          : 'Sự kết hợp sảng khoái của các loại trái cây tốt nhất, trình bày tinh tế.',
      };
    } else if (lower.includes('kem matcha') || lower.includes('matcha red bean ice')) {
      return {
        ingredients: isEn
          ? 'Premium Japanese matcha, red bean paste, kinako powder, fresh cream, milk.'
          : 'Matcha Nhật Bản thượng hạng, đậu đỏ hầm, bột kinako, kem tươi, sữa.',
        taste: isEn
          ? 'Earthy matcha ice cream with sweet red bean and nutty kinako — a Japanese-Chinese fusion delight.'
          : 'Kem matcha đậm đà với đậu đỏ ngọt và kinako bùi — sự giao thoa Nhật-Trung tuyệt hảo.',
      };
    } else if (lower.includes('khúc bạch') || lower.includes('panna cotta vietnamese')) {
      return {
        ingredients: isEn
          ? 'Fresh cream, gelatin, sugar, pomelo blossom water, pomegranate seeds.'
          : 'Kem tươi, gelatin, đường, nước hoa bưởi, hạt lựu đỏ.',
        taste: isEn
          ? 'Silky smooth milk jelly in fragrant pomelo syrup with ruby pomegranate gems.'
          : 'Thạch sữa mịn mướt trong nước đường hoa bưởi thơm với hạt lựu đỏ rubi.',
      };
    } else if (lower.includes('flan') || lower.includes('caramel') || lower.includes('crème')) {
      return {
        ingredients: isEn
          ? 'Eggs, fresh milk, vanilla extract, caramel sugar, heavy cream.'
          : 'Trứng gà, sữa tươi, tinh chất vani, đường caramel, kem béo.',
        taste: isEn
          ? 'Velvety smooth custard crowned with bittersweet golden caramel sauce.'
          : 'Bánh flan mịn như nhung, phủ lớp caramel vàng óng đắng ngọt hài hòa.',
      };
    } else if (lower.includes('nước ép cam') || lower.includes('orange juice')) {
      return {
        ingredients: isEn ? 'Fresh-squeezed oranges, ice.' : 'Cam sành vắt tươi, đá.',
        taste: isEn ? 'Bright, tangy, naturally sweet and refreshing.' : 'Tươi sáng, chua ngọt tự nhiên, sảng khoái.',
      };
    } else if (lower.includes('dưa hấu') || lower.includes('watermelon juice')) {
      return {
        ingredients: isEn ? 'Fresh watermelon, ice, a touch of lime.' : 'Dưa hấu tươi, đá, chút chanh.',
        taste: isEn ? 'Cool, sweet, incredibly hydrating summer refreshment.' : 'Mát lạnh, ngọt lịm, giải khát mùa hè tuyệt vời.',
      };
    } else if (lower.includes('nước ép táo') || lower.includes('apple juice')) {
      return {
        ingredients: isEn ? 'Fresh green apples, ice, honey.' : 'Táo xanh tươi, đá, mật ong.',
        taste: isEn ? 'Crisp, sweet-tart, wonderfully refreshing.' : 'Tươi giòn, chua ngọt, sảng khoái tuyệt vời.',
      };
    } else if (lower.includes('sinh tố xoài') || lower.includes('mango smoothie')) {
      return {
        ingredients: isEn ? 'Ripe Hoa Loc mangoes, fresh milk, crushed ice.' : 'Xoài cát Hòa Lộc chín, sữa tươi, đá bào.',
        taste: isEn ? 'Thick, luscious, tropical mango bliss in every sip.' : 'Đặc sánh, ngọt lịm, thiên đường xoài nhiệt đới trong từng ngụm.',
      };
    } else if (lower.includes('sinh tố bơ') || lower.includes('avocado smoothie')) {
      return {
        ingredients: isEn ? 'Dak Lak avocado, condensed milk, crushed ice.' : 'Bơ sáp Đắk Lắk, sữa đặc, đá bào.',
        taste: isEn ? 'Incredibly creamy, rich, and indulgently smooth.' : 'Cực kỳ béo ngậy, đậm đà, mịn màng say đắm.',
      };
    } else if (lower.includes('trà đào cam sả') || lower.includes('peach lemongrass')) {
      return {
        ingredients: isEn ? 'Green tea, peach slices, orange, lemongrass, ice.' : 'Trà xanh, đào ngâm, cam tươi, sả, đá.',
        taste: isEn ? 'Tropical, fruity, with a zesty lemongrass kick.' : 'Nhiệt đới, trái cây tươi mát, kích thích hương sả.',
      };
    } else if (lower.includes('sữa đậu nành') || lower.includes('soya bean milk')) {
      return {
        ingredients: isEn ? 'Whole soybeans, water, sugar.' : 'Đậu nành nguyên hạt, nước, đường.',
        taste: isEn ? 'Creamy, nutty, wholesome plant-based goodness.' : 'Béo thơm, bùi bùi, tinh chất thực vật bổ dưỡng.',
      };
    } else if (lower.includes('bia tiger') || lower.includes('tiger beer')) {
      return {
        ingredients: isEn ? 'Barley malt, hops, water, yeast.' : 'Mạch nha, hoa bia, nước, men.',
        taste: isEn ? 'Bold, full-bodied lager with a clean, crisp finish.' : 'Bia lager đậm đà mạnh mẽ với hậu vị sạch sẽ sảng khoái.',
      };
    } else if (lower.includes('bia heineken') || lower.includes('heineken beer')) {
      return {
        ingredients: isEn ? 'Premium barley, hops, A-yeast, purified water.' : 'Mạch nha thượng hạng, hoa bia, men A, nước tinh khiết.',
        taste: isEn ? 'Smooth European lager with subtle bitter hop notes and clean malt.' : 'Bia Hà Lan thanh nhẹ với nốt hoa bia đắng dịu và mạch nha sạch.',
      };
    } else if (lower.includes('bia sài gòn') || lower.includes('saigon beer')) {
      return {
        ingredients: isEn ? 'Barley malt, rice, hops, water.' : 'Mạch nha, gạo, hoa bia, nước.',
        taste: isEn ? 'Light, crisp Vietnamese lager, perfect with spicy food.' : 'Bia Việt nhẹ nhàng, thanh khiết, hoàn hảo với đồ cay.',
      };
    } else if (lower.includes('rượu vang đỏ') || lower.includes('red wine')) {
      return {
        ingredients: isEn ? 'Chilean Cabernet Sauvignon grapes, oak-aged.' : 'Nho Cabernet Sauvignon Chile, ủ thùng gỗ sồi.',
        taste: isEn ? 'Rich berry fruit, smooth tannins, elegant oak finish.' : 'Trái cây chín đậm đà, tannin mềm mại, hậu vị gỗ sồi thanh lịch.',
      };
    } else if (lower.includes('rượu vang trắng') || lower.includes('white wine')) {
      return {
        ingredients: isEn ? 'French Chardonnay grapes, stainless steel fermented.' : 'Nho Chardonnay Pháp, lên men thùng inox.',
        taste: isEn ? 'Crisp tropical fruit, vanilla, refreshingly elegant.' : 'Trái cây nhiệt đới tươi mát, vani, thanh nhã sảng khoái.',
      };
    } else if (lower.includes('champagne')) {
      return {
        ingredients: isEn ? 'French Champagne blend, méthode champenoise.' : 'Blend Champagne Pháp, phương pháp truyền thống.',
        taste: isEn ? 'Fine persistent bubbles, notes of rose and fresh grapefruit.' : 'Sủi bọt mịn bền bỉ, hương hoa hồng và bưởi tươi.',
      };
    } else if (lower.includes('chivas') || lower.includes('whisky') || lower.includes('whiskey')) {
      return {
        ingredients: isEn ? 'Blended Scotch whisky aged 18 years, single malt.' : 'Whisky Scotland pha trộn 18 năm tuổi, single malt.',
        taste: isEn ? 'Rich chocolate, dried fruit, and elegant smoky oak.' : 'Socola đậm đà, trái cây khô, và gỗ sồi khói thanh lịch.',
      };
    } else if (lower.includes('sprite')) {
      return {
        ingredients: isEn ? 'Carbonated water, sugar, citric acid, lime flavoring.' : 'Nước có ga, đường, acid citric, hương chanh.',
        taste: isEn ? 'Crisp lemon-lime sparkle, intensely refreshing.' : 'Chanh lime sủi bọt sảng khoái, giải khát mãnh liệt.',
      };
    } else if (lower.includes('chanh mật ong') || lower.includes('honey lemon')) {
      return {
        ingredients: isEn ? 'Fresh lemons, pure honey, warm water.' : 'Chanh vàng tươi, mật ong nguyên chất, nước ấm.',
        taste: isEn ? 'Soothing, gently sweet and tart, cleansing and warming.' : 'Dịu nhẹ, ngọt chua thanh, thanh lọc và ấm áp.',
      };
    } else if (lower.includes('phổ nhĩ') || lower.includes('pu-erh') || lower.includes('pu erh')) {
      return {
        ingredients: isEn ? 'Aged Yunnan Pu-erh tea leaves, hot water.' : 'Lá trà Phổ Nhĩ Vân Nam lên men, nước nóng.',
        taste: isEn ? 'Earthy, mellow, smooth with a warm woody depth — perfect digestif.' : 'Mộc mạc, êm dịu, mượt mà với chiều sâu gỗ ấm — trà tiêu hóa tuyệt vời.',
      };
    } else {
      return {
        ingredients: isEn
          ? 'Handpicked fresh organic ingredients of the day, classic Chinese spices, house-special cooking oils, secret stock broth.'
          : 'Nguyên liệu tươi sạch chọn lọc thủ công trong ngày từ nông trại đạt chuẩn, gia vị Trung Hoa cổ truyền, dầu hào hảo hạng, nước cốt dùng đặc chế.',
        taste: isEn
          ? 'Perfectly balanced, fresh natural flavors, and rich authentic culinary satisfaction.'
          : 'Hương vị thơm ngon trọn vẹn, tinh tế đậm đà ẩm thực Trung Hoa đặc sắc lưu luyến thực khách.',
      };
    }
  };

  const infoDetails = getFoodDetails(food.name);

  // Generate realistic reviews when database doesn't have any
  const getMockReviews = (name: string) => {
    if (language === 'en') {
      return [
        {
          id: 'mock-1',
          username: 'Johnathan Doe',
          comment: `The ${name} is absolutely spectacular! Perfectly seasoned, aromatic, and cooked to perfection. Highly recommended!`,
          rating: 5,
          createdAt: '2026-05-20T19:30:00Z',
        },
        {
          id: 'mock-2',
          username: 'Emily Watson',
          comment: `Beautiful presentation and fresh ingredients. 3Ship service is outstanding!`,
          rating: 5,
          createdAt: '2026-05-18T12:15:00Z',
        },
        {
          id: 'mock-3',
          username: 'Michael Nguyen',
          comment: `Delicious taste, very clean and matches the authentic culinary styles. Definite recommendation.`,
          rating: 4,
          createdAt: '2026-05-15T08:45:00Z',
        },
      ];
    }
    return [
      {
        id: 'mock-1',
        username: 'Trần Đại Nghĩa',
        comment: `Món ${name} cực ngon, hương vị đậm đà vừa miệng, đóng gói sạch sẽ. Nhất định sẽ gọi lại!`,
        rating: 5,
        createdAt: '2026-05-20T19:30:00Z',
      },
      {
        id: 'mock-2',
        username: 'Nguyễn Bích Thủy',
        comment: `Món ăn bày trí rất đẹp mắt, hương vị thơm ngon tinh tế, nguyên liệu tươi rói cảm nhận rõ rệt. 3Ship làm ăn rất chuyên nghiệp!`,
        rating: 5,
        createdAt: '2026-05-18T12:15:00Z',
      },
      {
        id: 'mock-3',
        username: 'Phạm Minh Quân',
        comment: `Đã thử nhiều nơi nhưng hương vị ở đây vẫn là đỉnh nhất. Rất hợp khẩu vị gia đình tôi. 4.8 sao là hoàn toàn xứng đáng!`,
        rating: 4,
        createdAt: '2026-05-15T08:45:00Z',
      },
    ];
  };

  const activeReviews = ratings.length > 0 ? ratings : getMockReviews(translateDbText(food.name));

  const handleFavoriteClick = () => {
    if (!isLoggedIn) {
      Alert.alert(
        language === 'vi' ? 'Đăng nhập để thả tim' : 'Login Required',
        language === 'vi' ? 'Vui lòng đăng nhập để lưu món ăn này vào danh sách yêu thích.' : 'Please log in to save this dish to your favorites.',
        [{ text: t('close') }]
      );
      return;
    }
    onToggleFavorite(food.id, !isFav);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {language === 'vi' ? 'Chi tiết món ăn' : 'Dish Details'}
            </Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F3E7E4' }]}>
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Main Body */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Food Image */}
            <View style={styles.imageWrapper}>
              <FoodImage uri={food.imageUrl} size={220} style={styles.image} />
            </View>

            {/* Title & Favorite Row */}
            <View style={styles.titleRow}>
              <View style={styles.titleCol}>
                <Text style={[styles.foodName, { color: colors.text }]}>{translateDbText(food.name)}</Text>
                {food.categoryName && (
                  <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={[styles.categoryText, { color: colors.primary }]}>{translateDbText(food.categoryName)}</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity onPress={handleFavoriteClick} style={styles.favBtn}>
                <Ionicons
                  name={isFav ? 'heart' : 'heart-outline'}
                  size={28}
                  color={isFav ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Price tag */}
            <Text style={[styles.foodPrice, { color: colors.primary }]}>{formatVnd(food.price)}</Text>

            {/* Tabs Selector (ONLY 2 TABS: Mô tả, Đánh giá) */}
            <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => setActiveTab('info')}
                style={[
                  styles.tabButton,
                  activeTab === 'info' && { borderBottomColor: colors.primary }
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === 'info' ? colors.primary : colors.textSecondary }
                  ]}
                >
                  {t('description')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setActiveTab('reviews')}
                style={[
                  styles.tabButton,
                  activeTab === 'reviews' && { borderBottomColor: colors.primary }
                ]}
              >
                <View style={styles.reviewTabRow}>
                  <Text
                    style={[
                      styles.tabText,
                      { color: activeTab === 'reviews' ? colors.primary : colors.textSecondary }
                    ]}
                  >
                    {t('reviews')}
                  </Text>
                  <View style={[styles.ratingCountBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.ratingCountText}>
                      {ratings.length > 0 ? ratings.length : activeReviews.length}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Tab content */}
            <View style={styles.tabContentContainer}>
              {activeTab === 'info' && (
                <View>
                  {/* PART 1: Rating Summary Box matching Image 1 */}
                  <View style={[styles.ratingSummaryBox, { backgroundColor: isDarkMode ? '#121212' : '#FDF7F5', borderColor: colors.border, borderWidth: 1 }]}>
                    <View style={styles.ratingSummaryLeft}>
                      <Ionicons name="star" size={28} color="#FFD700" />
                      <Text style={[styles.ratingAverageText, { color: colors.text }]}>
                        {(food.avgRating ?? 4.8).toFixed(1)} / 5.0
                      </Text>
                    </View>
                    <Text style={[styles.ratingTotalText, { color: colors.textSecondary }]}>
                      {t('averageRatingText')} {food.ratingCount || 120} {t('reviewsCountText')}
                    </Text>
                  </View>

                  {/* PART 2: Taste & Texture Description */}
                  <View style={styles.infoSection}>
                    <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('tasteTitle')}</Text>
                    <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                      {food.description || (language === 'vi' 
                        ? 'Không có mô tả chi tiết đặc biệt nào dành riêng cho món ăn này từ nhà hàng 3Ship. Tuy nhiên, chất lượng và hương vị món ăn chắc chắn sẽ làm vừa lòng thực khách!'
                        : 'No custom description available for this dish. However, the quality and taste of 3Ship culinary dishes are guaranteed to satisfy you!')}
                    </Text>
                    <Text style={[styles.descriptionText, { color: colors.textSecondary, marginTop: 8, fontStyle: 'italic' }]}>
                      {infoDetails.taste}
                    </Text>
                  </View>

                  {/* PART 3: Ingredients Bulleted List */}
                  <View style={styles.infoSection}>
                    <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('ingredientsTitle')}</Text>
                    <View style={styles.ingredientsContainer}>
                      {infoDetails.ingredients.split(',').map((ingredient, index) => (
                        <View key={index} style={styles.bulletRow}>
                          <Ionicons name="ellipse" size={6} color={colors.primary} style={styles.bulletIcon} />
                          <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                            {ingredient.trim()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {activeTab === 'reviews' && (
                <View>
                  {loadingRatings ? (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
                  ) : (
                    activeReviews.map((item) => (
                      <View key={item.id} style={[styles.reviewItem, { borderBottomColor: colors.border }]}>
                        <View style={styles.reviewHeader}>
                          <Text style={[styles.reviewUser, { color: colors.text }]}>{item.username}</Text>
                          <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>
                            {item.createdAt ? item.createdAt.substring(0, 10) : ''}
                          </Text>
                        </View>
                        <View style={styles.reviewStars}>
                          <StarRating rating={item.rating} size={12} />
                        </View>
                        <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>
                          {item.comment}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Add to Cart Button (Swapped to notebook style reader-outline icon) */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.addToCartBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                onAddToCart(food);
                onClose();
              }}
            >
              <Ionicons name="reader-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.addToCartBtnText}>
                {t('addToCart')} - {formatVnd(food.price)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '85%',
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  imageWrapper: {
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    borderRadius: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleCol: {
    flex: 1,
  },
  foodName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  favBtn: {
    padding: 4,
  },
  foodPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewTabRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingCountBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 4,
  },
  ratingCountText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  tabContentContainer: {
    minHeight: 180,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 21,
  },
  ratingSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 20,
    gap: 12,
  },
  ratingSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingAverageText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  ratingTotalText: {
    fontSize: 12,
    flex: 1,
  },
  infoSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ingredientsContainer: {
    paddingLeft: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  bulletIcon: {
    marginTop: 2,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  emptyReviews: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  reviewDate: {
    fontSize: 11,
  },
  reviewStars: {
    marginBottom: 6,
  },
  reviewComment: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  addToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 25,
  },
  addToCartBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
